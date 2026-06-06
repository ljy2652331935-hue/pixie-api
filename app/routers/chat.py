"""
Pixie Chat API 路由
───────────────────
POST /api/pixie/chat
用户和自己的小精灵私聊、吐槽、交流。
"""

from fastapi import APIRouter, HTTPException

from app.models import ChatRequest, ChatResponse
from app.prompts.lumi import CHAT_SYSTEM_PROMPT
from app.services.llm_service import build_user_message_for_chat, call_llm

router = APIRouter(prefix="/api/pixie", tags=["Pixie Chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="私聊小精灵",
    description="用户私下和小精灵交流，获取社交建议、情绪陪伴和安全提醒。",
)
async def chat_with_pixie(request: ChatRequest) -> ChatResponse:
    """
    Pixie Chat API

    用户可以私下问小精灵任何社交问题，
    小精灵作为社交军师和情绪搭子给出建议。
    """
    try:
        # 构建聊天上下文
        chat_context = [
            msg.model_dump(by_alias=True) for msg in request.chat_context
        ]

        # 构建用户消息
        user_message = build_user_message_for_chat(
            private_question=request.private_question,
            chat_context=chat_context,
        )

        # 调用 LLM
        result = await call_llm(
            system_prompt=CHAT_SYSTEM_PROMPT,
            user_message=user_message,
            temperature=0.85,
        )

        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 调用失败: {str(e)}")
