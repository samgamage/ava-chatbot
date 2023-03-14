import logging
from functools import lru_cache

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseSettings
from langchain import OpenAI, SerpAPIWrapper
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import Tool, AgentExecutor, ConversationalAgent
from langchain.callbacks.base import AsyncCallbackManager
from langchain.chains.moderation import OpenAIModerationChain

from callback import StreamingCallbackHandler
from schemas import ChatResponse
from prompts import SYSTEM_PROMPT_PREFIX, SYSTEM_PROMPT_SUFFIX

app = FastAPI()


class Settings(BaseSettings):
    openai_api_key: str
    serpapi_api_key: str

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket, settings: Settings = Depends(get_settings)):
    await websocket.accept()
    
    streaming_callback_handler = StreamingCallbackHandler(websocket)

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
            name = "Search",
            func=search.run,
            coroutine=search.arun,
            description="useful for when you need to answer questions about current events or questions you DO NOT know the answer to",
        )
    ]
    
    agent = ConversationalAgent.from_llm_and_tools(
        llm=llm,
        tools=tools,
        prefix=SYSTEM_PROMPT_PREFIX,
        suffix=SYSTEM_PROMPT_SUFFIX,
        input_variables=["input", "chat_history", "agent_scratchpad", "language"],
        memory=memory,
        verbose=True,
    )
    executor = AgentExecutor.from_agent_and_tools(
        agent=agent,
        tools=tools,
        verbose=True,
    )
    moderation_chain = OpenAIModerationChain(
        memory=memory,
        openai_api_key=settings.openai_api_key,
        error=True,
    )
    chat_history = []
    
    while True:
        try:
            # Receive and send back the client message
            message = await websocket.receive_text()
            resp = ChatResponse(sender="you", message=message, type="stream")
            await websocket.send_json(resp.dict())

            # Construct a response
            start_resp = ChatResponse(sender="bot", message="", type="start")
            await websocket.send_json(start_resp.dict())

            # Run the agent
            response = await executor.arun(input=message, language="en", chat_history=chat_history)

            end_resp = ChatResponse(sender="bot", message="", type="end")
            await websocket.send_json(end_resp.dict())
            chat_history.append((message, response))
            
            try:
                moderation_chain.run(response)
            except ValueError as err:
                content_violation_resp = ChatResponse(sender="bot", message="Chat violates content policy.", type="error")
                await websocket.send_json(content_violation_resp.dict())
            
        except WebSocketDisconnect:
            logging.info("websocket disconnect")
            break
        except Exception as e:
            logging.error(e)
            resp = ChatResponse(
                sender="bot",
                message="Sorry, something went wrong.",
                type="error",
            )
            await websocket.send_json(resp.dict())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", log_level="debug", port=9000)
