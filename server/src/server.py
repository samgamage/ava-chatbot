import asyncio
import logging
import json
from functools import lru_cache
import uuid

import aioredis
from aioredis import Redis
import redis.asyncio as redis
from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from pydantic import BaseModel, BaseSettings
from langchain import OpenAI, PromptTemplate, SerpAPIWrapper
from langchain.chat_models.openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory, ReadOnlySharedMemory
from langchain.agents import Tool, AgentExecutor, ConversationalAgent, initialize_agent
from langchain.callbacks.base import AsyncCallbackManager
from langchain.chains.moderation import OpenAIModerationChain
from langchain.chains import LLMChain
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.schema import (
    AIMessage,
    HumanMessage,
    SystemMessage
)
from sse_starlette.sse import EventSourceResponse

from callback import AgentCallbackHandler, StreamingCallbackHandler, ToolCallbackHandler
from schemas import ChatResponse, SystemResponse, UserInput, gen_id
from prompts import SYSTEM_PROMPT_PREFIX, SYSTEM_PROMPT_SUFFIX, CHAT_SYSTEM_PROMPT_TEMPLATE
from validator import Auth0JWTBearerTokenValidator

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"],  allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

FORMAT = "%(levelname)s:%(message)s"
logging.basicConfig(format=FORMAT, level=logging.INFO)
logger = logging.getLogger(__name__)

STREAM_DELAY = 1  # second
RETRY_TIMEOUT = 15000  # milisecond

class Settings(BaseSettings):
    openai_api_key: str
    serpapi_api_key: str
    redis_server: str
    auth_domain: str
    api_identifier: str = "api://ava-chat"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


async def get_redis(settings: Settings = Depends(get_settings)):
    return await aioredis.from_url(f"redis://{settings.redis_server}")


@app.get("/healthz")
def get_healthz():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    settings = get_settings()
    redis_instance = redis.from_url(f"redis://{settings.redis_server}", encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis_instance)
    

@app.on_event("shutdown")
async def shutdown():
    await FastAPILimiter.close()


def construct_sse(data: BaseModel, type = "message", id = gen_id("evt")):
    return {
        "event": type,
        "id": id,
        "retry": RETRY_TIMEOUT,
        "data": data.json(),
    }


SUMMARY_TEMPLATE = """This is a conversation between a human and a bot:

{chat_history}

Write a summary of the conversation for {input}:
"""


@app.post(
    "/api/chat",
    dependencies=[
        # Depends(RateLimiter(times=1, seconds=5)),
        # Depends(RateLimiter(times=2, seconds=15)),
        # Depends(RateLimiter(times=10, hours=1)),
    ], 
)
async def chat_endpoint(
    request: Request,
    user_input: UserInput,
    redis: Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings)
):
    validator = Auth0JWTBearerTokenValidator(
        settings.auth_domain,
        settings.api_identifier
    )

    try:
        token_string = request.headers["Authorization"].split(" ")[1]
        token = validator.authenticate_token(token_string)
        validator.validate_token(token, ["read:messages"], request)
        user_id = token.get('sub')
    except Exception as e:
        logger.error(e)
        return SystemResponse(
            text="Sorry, something went wrong.",
            type="error",
            conversation_id=conversation_id,
        )

    moderation_chain = OpenAIModerationChain(
        openai_api_key=settings.openai_api_key,
        error=True,
    )
    chat_history = []
    conversation_cache_prefix = "conversation"
    conversation_id = None

    # Receive and send back the client message
    message = user_input.text
    conversation_id = user_input.conversation_id or str(uuid.uuid4())
    response_id = gen_id("resp_")
        
    chat_history_raw = await redis.get(f"{conversation_cache_prefix}:{conversation_id}")
    chat_history = json.loads(chat_history_raw) if chat_history_raw else []
    
    if len(chat_history) == 10:
        return SystemResponse(id=response_id, text="Reached conversation limit", type="error", conversation_id=conversation_id)

    async def response_stream_generator():
        def stream_response(response):
            logger.info("stream_response", response)
            yield construct_sse(ChatResponse(id=response_id, sender="bot", text=response, type="stream", conversation_id=conversation_id))

        search = SerpAPIWrapper(
            serpapi_api_key=settings.serpapi_api_key,
            search_engine="google",
        )

        chat = ChatOpenAI(
            openai_api_key=settings.openai_api_key,
            callback_manager=AsyncCallbackManager([
                StreamingCallbackHandler(stream_response),
            ]),
            streaming=True,
        )
        llm = OpenAI(
            openai_api_key=settings.openai_api_key,
            streaming=True,
            verbose=True,
        )

        memory = ConversationBufferWindowMemory(memory_key="chat_history")
        readonlymemory = ReadOnlySharedMemory(memory=memory)

        tools = [
            Tool(
                name="Intermediate Answer",
                func=search.run,
                coroutine=search.arun,
                description="useful for when you need to ask with search"
            ),
        ]
        
        agent = initialize_agent(tools, llm, agent="self-ask-with-search", verbose=True)
        
        try:

            # Stream response

            agent_response = await agent.arun(
                {"input": message},
            )

            messages = [
                SystemMessage(CHAT_SYSTEM_PROMPT_TEMPLATE.format(agent_scratchpad=f"{message}: {agent_response}"))
            ]

            for response in chat_history:
                human_input, ai_response = chat_history
                messages.extend([
                    HumanMessagePromptTemplate.from_template(human_input),
                    AIMessagePromptTemplate.from_template(ai_response),
                ])

            # Generate a response from ChatGPT

            yield construct_sse(ChatResponse(id=response_id, sender="bot", text="", type="start", conversation_id=conversation_id))

            logger.info(messages)

            await chat.agenerate(messages)

            yield construct_sse(ChatResponse(id=response_id, sender="bot", text="", type="end", conversation_id=conversation_id))
        
            chat_history.append((message, response))
            
            # Save the conversation history
            await redis.setex(f"{conversation_cache_prefix}:{conversation_id}", 60*60*12, json.dumps(chat_history))

            try:
                moderation_chain.run(response)
            except ValueError as err:
                yield construct_sse(SystemResponse(
                    id=response_id,
                    sender="bot", text="Chat violates content policy.", type="error", conversation_id=conversation_id))
        except Exception as e:
            logging.error(e)
            yield construct_sse(SystemResponse(
                text="Sorry, something went wrong.",
                type="error",
                conversation_id=conversation_id
            ))

    return EventSourceResponse(response_stream_generator())

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", log_level="debug", port=9000)
