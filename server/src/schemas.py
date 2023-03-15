"""Schemas for the chat app."""
from typing import Optional
from pydantic import BaseModel, validator


class UserInput(BaseModel):
    """Chat response schema."""

    conversation_id: str
    text: str


class ChatResponse(BaseModel):
    """Chat response schema."""

    sender: str
    text: str
    type: str
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
