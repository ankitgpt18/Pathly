from fastapi import APIRouter
from models import ChatRequest, ChatResponse
from services.llm import chat_with_gemini

router = APIRouter(prefix="/api")


@router.post("/chat", response_model=ChatResponse)
async def handle_chat(req: ChatRequest):
    """Chat endpoint — powered by Gemini 2.5 Flash with function calling."""
    history = [{"role": m.role, "content": m.content} for m in req.history]

    result = await chat_with_gemini(
        text=req.text,
        lat=req.lat or 0,
        lon=req.lon or 0,
        history=history,
        language=req.language,
        mode=req.mode,
    )

    return ChatResponse(
        reply=result["reply"],
        intent=result["intent"],
        data=result.get("data", {}),
        language=result.get("language", "en"),
    )
