"""
Pixie Suggestion API 路由
─────────────────────────
POST /api/pixie/suggestion
分析用户话语，并给出更适合发送的表达建议。
"""

from fastapi import APIRouter, HTTPException

from app.models import SuggestionRequest, SuggestionResponse
from app.prompts.lumi import SUGGESTION_SYSTEM_PROMPT
from app.services.llm_service import build_user_message_for_suggestion, call_llm

router = APIRouter(prefix="/api/pixie", tags=["Pixie Suggestion"])


@router.post(
    "/suggestion",
    response_model=SuggestionResponse,
    summary="表达建议",
    description="分析用户准备发送的话，给出更自然、更适合当前社交场景的表达建议。",
)
async def get_suggestion(request: SuggestionRequest) -> SuggestionResponse:
    """
    Pixie Suggestion API

    根据用户的原始输入和当前聊天上下文，生成改写建议。
    支持四种模式：icebreaker / rewrite / boundary / plan
    """
    try:
        # 构建聊天上下文
        chat_context = [
            msg.model_dump(by_alias=True) for msg in request.chat_context
        ]

        # 构建用户消息
        user_message = build_user_message_for_suggestion(
            raw_message=request.raw_message,
            mode=request.mode.value,
            chat_context=chat_context,
        )

        # 调用 LLM
        result = await call_llm(
            system_prompt=SUGGESTION_SYSTEM_PROMPT,
            user_message=user_message,
            temperature=0.8,
        )

        return SuggestionResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 调用失败: {str(e)}")
