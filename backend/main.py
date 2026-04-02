from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers.chat import router as chat_router
from routers.voice import router as voice_router

app = FastAPI(
    title=settings.app_name,
    description="Voice-controlled transport AI assistant",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(voice_router)


@app.get("/")
async def root():
    return {
        "name": "Pathly API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "chat": "/api/chat",
            "voice_ws": "/api/voice",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
