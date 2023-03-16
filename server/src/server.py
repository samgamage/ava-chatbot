import logging
import json
from functools import lru_cache
import uuid

import aioredis
from aioredis import Redis
import redis.asyncio as redis
from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import WebSocketRateLimiter
from pydantic import BaseSettings
from langchain import OpenAI, SerpAPIWrapper
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import Tool, AgentExecutor, ConversationalAgent
from langchain.callbacks.base import AsyncCallbackManager
from langchain.chains.moderation import OpenAIModerationChain

from callback import AgentCallbackHandler, StreamingCallbackHandler, ToolCallbackHandler
from schemas import ChatResponse, UserInput
from prompts import SYSTEM_PROMPT_PREFIX, SYSTEM_PROMPT_SUFFIX
from validator import Auth0JWTBearerTokenValidator

app = FastAPI()

FORMAT = "%(levelname)s:%(message)s"
logging.basicConfig(format=FORMAT, level=logging.INFO)
logger = logging.getLogger(__name__)

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


@app.websocket("/api/chat")
async def websocket_endpoint(websocket: WebSocket, redis: Redis = Depends(get_redis), settings: Settings = Depends(get_settings)):
    await websocket.accept()
    validator = Auth0JWTBearerTokenValidator(
        settings.auth_domain,
        settings.api_identifier
    )
    ratelimit = WebSocketRateLimiter(times=1, seconds=5)

    streaming_callback_handler = StreamingCallbackHandler(websocket)
    agent_callback_handler = AgentCallbackHandler(websocket)
    tool_callback_handler = ToolCallbackHandler(websocket)

    llm = OpenAI(
        openai_api_key=settings.openai_api_key,
        streaming=True,
        callback_manager=AsyncCallbackManager([streaming_callback_handler]),
        verbose=True,
        temperature=0,
    )

    memory = ConversationBufferWindowMemory(memory_key="chat_history")
    search = SerpAPIWrapper(
        serpapi_api_key=settings.serpapi_api_key,
        search_engine="google",
    )

    tools = [
        Tool(
            name="Search",
            func=search.run,
            coroutine=search.arun,
            description="useful for when you need to answer questions about current events or questions you DO NOT know the answer to",
            callback_manager=AsyncCallbackManager([tool_callback_handler])
        )
    ]

    agent = ConversationalAgent.from_llm_and_tools(
        llm=llm,
        tools=tools,
        prefix=SYSTEM_PROMPT_PREFIX,
        suffix=SYSTEM_PROMPT_SUFFIX,
        input_variables=["input", "chat_history",
                         "agent_scratchpad", "language"],
        memory=memory,
        callback_manager=AsyncCallbackManager([agent_callback_handler]),
        verbose=True,
    )
    executor = AgentExecutor.from_agent_and_tools(
        agent=agent,
        tools=tools,
        verbose=True,
    )
    moderation_chain = OpenAIModerationChain(
        openai_api_key=settings.openai_api_key,
        memory=memory,
        error=True,
    )
    chat_history = []
    conversation_cache_prefix = "conversation"
    conversation_id = None
    user_id = None

    while True:
        try:    
            # Receive and send back the client message
            message = await websocket.receive_json()
            user_input = UserInput.parse_obj(message)
            conversation_id = user_input.conversation_id or str(uuid.uuid4())
            
            if user_input.type == "authenticate":
                try:
                    token_string = user_input.token
                    token = validator.authenticate_token(token_string)
                    validator.validate_token(token, ["read:messages"], websocket)
                    user_id = token.get('sub')
                except Exception as e:
                    logger.error(e)
                    resp = ChatResponse(
                        sender="bot",
                        text="Sorry, something went wrong.",
                        type="error",
                    )
                    await websocket.send_json(resp.dict())
            else:
                logger.info(f"user_id={user_id}")
                resp = await ratelimit(websocket, context_key=user_id)
                
                chat_history_raw = await redis.get(f"{conversation_cache_prefix}:{conversation_id}")
                chat_history = json.loads(chat_history_raw) if chat_history_raw else []

                # Construct a response
                start_resp = ChatResponse(sender="bot", text="", type="start", conversation_id=conversation_id)
                await websocket.send_json(start_resp.dict())
                
                if len(chat_history) == 10:
                    resp = ChatResponse(sender="bot", text="Reached conversation limit", type="error")
                    await websocket.send_json(resp.dict())
                    break

                # Run the agent
                response = await executor.arun(input=user_input.text, language="en", chat_history=chat_history)

                end_resp = ChatResponse(sender="bot", text="", type="end", conversation_id=conversation_id)
                await websocket.send_json(end_resp.dict())
                chat_history.append((message, response))
                
                # Save the conversation history
                await redis.setex(f"{conversation_cache_prefix}:{conversation_id}", 60*60*12, json.dumps(chat_history))

                try:
                    moderation_chain.run(response)
                except ValueError as err:
                    content_violation_resp = ChatResponse(
                        sender="bot", text="Chat violates content policy.", type="error", conversation_id=conversation_id)
                    await websocket.send_json(content_violation_resp.dict())            
        except WebSocketDisconnect:
            logging.info("websocket disconnect")
            break
        except Exception as e:
            logging.error(e)
            resp = ChatResponse(
                sender="bot",
                text="Sorry, something went wrong.",
                type="error",
                conversation_id=conversation_id
            )
            await websocket.send_json(resp.dict())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", log_level="debug", port=9000)
