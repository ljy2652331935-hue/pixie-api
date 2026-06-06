"""
Pixie Auto Context API 路由
────────────────────────────
POST /api/pixie/auto-context
小精灵自动读取聊天上下文，并在合适时机主动发言。
"""

from fastapi import APIRouter, HTTPException

from app.models import AutoContextRequest, AutoContextResponse
from app.prompts.lumi import AUTO_CONTEXT_SYSTEM_PROMPT
from app.services.llm_service import build_user_message_for_auto_context, call_llm

router = APIRouter(prefix="/api/pixie", tags=["Pixie Auto Context"])


@router.post(
    "/auto-context",
    response_model=AutoContextResponse,
    summary="读取房间",
    description="小精灵分析当前聊天上下文，判断是否需要发言以及如何发言。",
)
async def read_the_room(request: AutoContextRequest) -> AutoContextResponse:
    """
    Pixie Auto Context API

    用户点击 "Let Lumi read the room" 后触发。
    小精灵分析聊天上下文，决定是否主动发言。
    """
    try:
        # 构建聊天上下文
        chat_context = [
            msg.model_dump(by_alias=True) for msg in request.chat_context
        ]

        # 构建活动意图
        activity_intent = None
        if request.activity_intent:
            activity_intent = request.activity_intent.model_dump()

        # 构建用户消息
        user_message = build_user_message_for_auto_context(
            chat_context=chat_context,
            activity_intent=activity_intent,
        )

        # 调用 LLM
        result = await call_llm(
            system_prompt=AUTO_CONTEXT_SYSTEM_PROMPT,
            user_message=user_message,
            temperature=0.7,
        )

        return AutoContextResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 调用失败: {str(e)}")
