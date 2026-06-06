"""
Pixie API — 主入口
──────────────────
Sponty 小精灵社交副驾驶 API 服务

启动方式:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auto_context, chat, suggestion

# ─── 创建 FastAPI 应用 ──────────────────────────────────────

app = FastAPI(
    title="Pixie API",
    description=(
        "Sponty 小精灵社交副驾驶 API。\n\n"
        "Pixie 帮助用户在社交场景中更好地表达自己，"
        "提供表达建议、私聊陪伴和上下文感知能力。\n\n"
        "**核心端点：**\n"
        "- `POST /api/pixie/suggestion` — 表达建议（改写/破冰/边界/计划）\n"
        "- `POST /api/pixie/chat` — 私聊小精灵\n"
        "- `POST /api/pixie/auto-context` — 读取房间（Let Lumi read the room）\n"
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS 中间件（开发环境允许所有来源）─────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 注册路由 ───────────────────────────────────────────────

app.include_router(suggestion.router)
app.include_router(chat.router)
app.include_router(auto_context.router)


# ─── 健康检查 ───────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def health_check():
    """健康检查端点"""
    return {
        "status": "ok",
        "service": "Pixie API",
        "version": "0.1.0",
        "pixie": "Lumi",
        "message": "✨ Lumi is ready to help you show up better!",
    }


@app.get("/api/pixie/status", tags=["Health"])
async def pixie_status():
    """Pixie 状态端点"""
    return {
        "pixieId": "lumi",
        "status": "active",
        "capabilities": [
            "suggestion",
            "chat",
            "auto-context",
        ],
        "personality": "毒舌但靠谱的社交搭子",
    }
