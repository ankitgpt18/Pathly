from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import JSONResponse
import json

from services.llm import chat_with_gemini

router = APIRouter(prefix="/api")


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Offline speech-to-text via Vosk. Accepts audio file, returns transcribed text."""
    try:
        from services.stt import transcribe_audio as vosk_transcribe

        audio_bytes = await file.read()
        text = vosk_transcribe(audio_bytes)
        return {"text": text, "engine": "vosk"}
    except ImportError:
        return JSONResponse(
            status_code=503,
            content={"error": "Vosk not installed. Run: pip install vosk soundfile"},
        )
    except Exception as e:
        print(f"Transcription error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Transcription failed: {str(e)}"},
        )


@router.websocket("/voice")
async def voice_endpoint(websocket: WebSocket):
    """WebSocket voice endpoint — real-time chat via Gemini."""
    await websocket.accept()
    conversation_history = []

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            text = message.get("text", "")
            if not text:
                await websocket.send_json({"error": "No text received"})
                continue

            lat = message.get("lat", 0) or 0
            lon = message.get("lon", 0) or 0

            # Add to conversation history
            conversation_history.append({"role": "user", "content": text})

            result = await chat_with_gemini(
                text=text,
                lat=lat,
                lon=lon,
                history=conversation_history[-10:],
            )

            # Add assistant response to history
            conversation_history.append({"role": "assistant", "content": result["reply"]})

            await websocket.send_json({
                "reply": result["reply"],
                "intent": result["intent"],
                "data": result.get("data", {}),
                "language": result.get("language", "en"),
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
