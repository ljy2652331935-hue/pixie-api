"""
LLM 调用服务层
──────────────
封装 OpenAI API 调用，统一处理 prompt 组装与 JSON 解析。
"""

from __future__ import annotations

import json
import os
from typing import Any

from openai import AsyncOpenAI

# 使用环境变量中预配置的 API Key 和 Base URL
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE"),
)

# 默认模型 — 可通过环境变量 PIXIE_MODEL 覆盖
DEFAULT_MODEL = os.getenv("PIXIE_MODEL", "gpt-5-mini")


async def call_llm(
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    temperature: float = 0.8,
    max_tokens: int = 2048,
) -> dict[str, Any]:
    """
    调用 LLM 并返回解析后的 JSON 字典。

    Args:
        system_prompt: 系统提示词（含人设和输出格式要求）
        user_message: 用户消息（含上下文和原始输入）
        model: 模型名称，默认使用 DEFAULT_MODEL
        temperature: 温度参数
        max_tokens: 最大输出 token 数

    Returns:
        解析后的 JSON 字典
    """
    model = model or DEFAULT_MODEL

    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )

    raw_content = response.choices[0].message.content
    if raw_content is None:
        raise ValueError(
            f"LLM returned empty content. "
            f"finish_reason={response.choices[0].finish_reason}"
        )
    content = raw_content.strip()

    # 尝试提取 JSON（处理可能的 markdown 代码块包裹）
    if content.startswith("```"):
        # 去除 ```json 和 ``` 包裹
        lines = content.split("\n")
        json_lines = []
        inside_block = False
        for line in lines:
            if line.strip().startswith("```"):
                inside_block = not inside_block
                continue
            if inside_block or not line.strip().startswith("```"):
                json_lines.append(line)
        content = "\n".join(json_lines)

    return json.loads(content)


def build_user_message_for_suggestion(
    raw_message: str,
    mode: str,
    chat_context: list[dict],
) -> str:
    """构建 Suggestion API 的用户消息"""
    context_text = ""
    if chat_context:
        context_text = "\n## 当前聊天上下文\n"
        for msg in chat_context:
            sender = msg.get("senderName", msg.get("sender_name", "Unknown"))
            content = msg.get("content", "")
            context_text += f"- {sender}: {content}\n"

    return f"""## 模式
{mode}

## 用户原始输入
{raw_message}
{context_text}
请分析用户意图并给出建议。"""


def build_user_message_for_chat(
    private_question: str,
    chat_context: list[dict],
) -> str:
    """构建 Chat API 的用户消息"""
    context_text = ""
    if chat_context:
        context_text = "\n## 当前公开聊天上下文\n"
        for msg in chat_context:
            sender = msg.get("senderName", msg.get("sender_name", "Unknown"))
            content = msg.get("content", "")
            context_text += f"- {sender}: {content}\n"

    return f"""## 用户私下问你的问题
{private_question}
{context_text}
请给出你的建议。"""


def build_user_message_for_auto_context(
    chat_context: list[dict],
    activity_intent: dict | None = None,
) -> str:
    """构建 Auto Context API 的用户消息"""
    context_text = "## 当前聊天上下文\n"
    if chat_context:
        for msg in chat_context:
            sender = msg.get("senderName", msg.get("sender_name", "Unknown"))
            content = msg.get("content", "")
            context_text += f"- {sender}: {content}\n"
    else:
        context_text += "（暂无聊天记录，双方刚匹配）\n"

    intent_text = ""
    if activity_intent:
        intent_text = f"""
## 活动意图
- 活动: {activity_intent.get('activity', '未知')}
- 区域: {activity_intent.get('area', '未知')}
- 时间: {activity_intent.get('time', '未知')}
"""

    return f"""{context_text}{intent_text}
请分析当前聊天状态，判断是否需要发言以及如何发言。"""
