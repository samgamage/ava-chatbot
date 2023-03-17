"""Schemas for the chat app."""
import uuid
from typing import Optional
from pydantic import BaseModel, validator, Field


def gen_id(prefix=""):
    """Generate a unique ID."""
    return f"{prefix}{uuid.uuid4().hex}"


class UserInput(BaseModel):
    """User input schema."""

    id: Optional[str] = Field(default_factory=lambda: gen_id(prefix="input_"))
    object: Optional[str] = "user_input"
    text: str
    role: Optional[str] = "user"
    conversation_id: Optional[str]


class SystemResponse(BaseModel):
    """System response schema."""

    id: Optional[str] = Field(default_factory=lambda: gen_id(prefix="sysresp_"))
    object: Optional[str] = "system_response"
    type: str
    text: str
    conversation_id: Optional[str]


class ChatResponse(BaseModel):
    """Chat response schema."""

    id: Optional[str] = Field(default_factory=lambda: gen_id(prefix="chatresp_"))
    object: Optional[str] = "chat_response"
    type: str
    text: str
    sender: str
    conversation_id: Optional[str]

    @validator("sender")
    def sender_must_be_bot_or_you(cls, v):
        if v not in ["bot", "user", "system"]:
            raise ValueError("sender must be bot, user or system")
        return v

    @validator("type")
    def validate_message_type(cls, v):
        if v not in ["start", "stream", "end", "error", "info", "search"]:
            raise ValueError("type must be start, stream or end")
        return v
