"""Callback handlers used in the app."""
import re
from typing import Any, Dict, Optional

from langchain.callbacks.base import AsyncCallbackHandler
from langchain.callbacks.stdout import StdOutCallbackHandler
from langchain.schema import AgentAction, AgentFinish, LLMResult

from schemas import ChatResponse


class StreamingCallbackHandler(AsyncCallbackHandler, StdOutCallbackHandler):
    """Callback handler for streaming LLM responses."""

    is_streaming_bot_response = False
    response = ""
    ai_prefix = "AI"
    ai_regex = None

    def __init__(self, websocket, ai_prefix: Optional[str] = "AI"):
        self.websocket = websocket
        self.ai_prefix = ai_prefix
        self.ai_regex = re.compile(f"{self.ai_prefix}:")
        self.is_streaming_bot_response = False
        self.response = ""

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        self.response += token
        
        if self.is_streaming_bot_response:
            resp = ChatResponse(sender="bot", text=token, type="stream")
            await self.websocket.send_json(resp.dict())
        elif self.ai_regex.search(self.response):
            self.is_streaming_bot_response = True
            
    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        self.is_streaming_bot_response = False
        self.response = ""


class ToolCallbackHandler(AsyncCallbackHandler, StdOutCallbackHandler):
    """Callback handler for agent actions."""

    def __init__(self, websocket):
        self.websocket = websocket
        
    async def on_tool_start(self, tool: Dict[str, Any], input_str: str, **kwargs: Any) -> None:
        await super().on_tool_start(tool, input_str, **kwargs)
        
        name = tool.get('name')
        
        if name == "Search":
            resp = ChatResponse(sender="bot", text=input_str, type="search")
            await self.websocket.send_json(resp.dict())


class AgentCallbackHandler(AsyncCallbackHandler, StdOutCallbackHandler):
    """Callback handler for agent actions."""

    def __init__(self, websocket):
        self.websocket = websocket

    async def on_agent_action(self, action: AgentAction, **kwargs: Any) -> None:
        await super().on_agent_action(action, **kwargs)
    
    async def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        await super().on_agent_finish(finish, **kwargs)
