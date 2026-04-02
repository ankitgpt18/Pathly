from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter(prefix="/api")


@router.websocket("/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)

            text = message.get("text", "")
            if not text:
                await websocket.send_json({"error": "No text received"})
                continue

            from services.intent import classify_intent
            from services.transport import get_next_bus, get_fare, get_nearby_stops
            from services.navigation import get_directions, geocode
            from services.response import (
                format_eta_response,
                format_fare_response,
                format_nearby_response,
                format_route_response,
                format_unknown_response,
            )

            intent = classify_intent(text)
            intent_type = intent["type"]
            dest = intent.get("destination")
            lat = message.get("lat")
            lon = message.get("lon")

            reply = ""
            response_data = {}

            if intent_type == "eta":
                bus_data = await get_next_bus("default")
                reply = format_eta_response(bus_data)
                response_data = bus_data

            elif intent_type == "fare":
                fare_data = await get_fare(intent.get("origin", "origin"), dest or "destination")
                reply = format_fare_response(fare_data)
                response_data = fare_data

            elif intent_type == "nearby":
                stops = await get_nearby_stops(lat or 28.6139, lon or 77.2090)
                reply = format_nearby_response(stops)
                response_data = {"stops": stops}

            elif intent_type == "route" and dest:
                coords = await geocode(dest)
                if coords:
                    route_data = await get_directions(lat or 28.6139, lon or 77.2090, coords[0], coords[1])
                else:
                    route_data = await get_directions(28.6139, 77.2090, 28.5562, 77.1000)
                reply = format_route_response(dest, route_data)
                response_data = route_data

            else:
                reply = format_unknown_response()

            await websocket.send_json({
                "reply": reply,
                "intent": intent_type,
                "data": response_data,
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
