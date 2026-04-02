from fastapi import APIRouter
from models import ChatRequest, ChatResponse
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

router = APIRouter(prefix="/api")


@router.post("/chat", response_model=ChatResponse)
async def handle_chat(req: ChatRequest):
    intent = classify_intent(req.text)
    intent_type = intent["type"]
    dest = intent.get("destination")

    reply = ""
    data = {}

    if intent_type == "eta":
        bus_data = await get_next_bus("default")
        reply = format_eta_response(bus_data)
        data = bus_data

    elif intent_type == "fare":
        origin = intent.get("origin", "origin")
        fare_data = await get_fare(origin or "origin", dest or "destination")
        reply = format_fare_response(fare_data)
        data = fare_data

    elif intent_type == "nearby":
        lat = req.lat or 28.6139
        lon = req.lon or 77.2090
        stops = await get_nearby_stops(lat, lon)
        reply = format_nearby_response(stops)
        data = {"stops": stops}

    elif intent_type == "route" and dest:
        coords = await geocode(dest)
        if coords:
            dest_lat, dest_lon = coords
            origin_lat = req.lat or 28.6139
            origin_lon = req.lon or 77.2090
            route_data = await get_directions(origin_lat, origin_lon, dest_lat, dest_lon)
        else:
            route_data = await get_directions(28.6139, 77.2090, 28.5562, 77.1000)
        reply = format_route_response(dest, route_data)
        data = route_data

    else:
        reply = format_unknown_response()
        data = {}

    return ChatResponse(reply=reply, intent=intent_type, data=data)
