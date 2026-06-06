"""
Pixie API — Pydantic 数据模型
定义三个核心 API 的请求与响应结构
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── 公共模型 ───────────────────────────────────────────────

class SenderType(str, Enum):
    human = "human"
    pixie = "pixie"
    system = "system"


class ChatMessage(BaseModel):
    """聊天上下文中的单条消息"""
    sender_name: str = Field(..., alias="senderName", description="发送者名称")
    sender_type: SenderType = Field(..., alias="senderType", description="发送者类型")
    content: str = Field(..., description="消息内容")

    class Config:
        populate_by_name = True


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


# ─── Suggestion API ─────────────────────────────────────────

class SuggestionMode(str, Enum):
    icebreaker = "icebreaker"
    rewrite = "rewrite"
    boundary = "boundary"
    plan = "plan"


class SuggestionRequest(BaseModel):
    """Pixie Suggestion API 请求体"""
    room_id: str = Field(..., alias="roomId", description="房间 ID")
    user_id: str = Field(..., alias="userId", description="用户 ID")
    pixie_id: str = Field(default="lumi", alias="pixieId", description="小精灵 ID")
    raw_message: str = Field(..., alias="rawMessage", description="用户原始输入")
    mode: SuggestionMode = Field(default=SuggestionMode.rewrite, description="建议模式")
    chat_context: list[ChatMessage] = Field(default=[], alias="chatContext", description="聊天上下文")

    class Config:
        populate_by_name = True


class SuggestionResponse(BaseModel):
    """Pixie Suggestion API 响应体"""
    detected_intent: str = Field(..., alias="detectedIntent", description="检测到的用户意图")
    emotion_detected: list[str] = Field(..., alias="emotionDetected", description="检测到的情绪")
    suggested_message: str = Field(..., alias="suggestedMessage", description="建议发送的消息")
    pixie_comment: str = Field(..., alias="pixieComment", description="小精灵私下评论")
    risk_level: RiskLevel = Field(..., alias="riskLevel", description="风险等级")
    confidence: float = Field(..., ge=0.0, le=1.0, description="置信度")

    class Config:
        populate_by_name = True


# ─── Chat API ───────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Pixie Chat API 请求体"""
    room_id: str = Field(..., alias="roomId", description="房间 ID")
    user_id: str = Field(..., alias="userId", description="用户 ID")
    pixie_id: str = Field(default="lumi", alias="pixieId", description="小精灵 ID")
    private_question: str = Field(..., alias="privateQuestion", description="用户私下问小精灵的问题")
    chat_context: list[ChatMessage] = Field(default=[], alias="chatContext", description="公开聊天上下文")

    class Config:
        populate_by_name = True


class ChatResponse(BaseModel):
    """Pixie Chat API 响应体"""
    private_advice: str = Field(..., alias="privateAdvice", description="小精灵给用户的私下建议")
    suggested_message: Optional[str] = Field(None, alias="suggestedMessage", description="可选的公开回复建议")
    safety_note: Optional[str] = Field(None, alias="safetyNote", description="安全提醒")

    class Config:
        populate_by_name = True


# ─── Auto Context API ───────────────────────────────────────

class Visibility(str, Enum):
    private = "private"
    public = "public"


class SuggestedAction(str, Enum):
    icebreaker = "icebreaker"
    rewrite = "rewrite"
    boundary = "boundary"
    plan = "plan"
    safety = "safety"
    none = "none"


class ActivityIntent(BaseModel):
    """活动意图"""
    activity: str = Field(..., description="活动类型")
    area: str = Field(..., description="区域")
    time: str = Field(..., description="时间")


class AutoContextRequest(BaseModel):
    """Pixie Auto Context API 请求体"""
    room_id: str = Field(..., alias="roomId", description="房间 ID")
    user_id: str = Field(..., alias="userId", description="用户 ID")
    pixie_id: str = Field(default="lumi", alias="pixieId", description="小精灵 ID")
    chat_context: list[ChatMessage] = Field(default=[], alias="chatContext", description="聊天上下文")
    activity_intent: Optional[ActivityIntent] = Field(None, alias="activityIntent", description="活动意图")

    class Config:
        populate_by_name = True


class AutoContextResponse(BaseModel):
    """Pixie Auto Context API 响应体"""
    should_speak: bool = Field(..., alias="shouldSpeak", description="是否应该发言")
    visibility: Visibility = Field(..., description="发言可见性")
    trigger_reason: str = Field(..., alias="triggerReason", description="触发原因")
    pixie_message: str = Field(..., alias="pixieMessage", description="小精灵要说的话")
    suggested_action: SuggestedAction = Field(..., alias="suggestedAction", description="建议动作")
    risk_level: RiskLevel = Field(..., alias="riskLevel", description="风险等级")

    class Config:
        populate_by_name = True
