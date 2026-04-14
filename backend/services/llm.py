"""Gemini 2.5 Flash integration with function calling for Pathly.

This is the AI brain — Gemini decides which tools to call based on
natural conversation, then generates responses in the user's language.
"""

import json
import asyncio
from datetime import datetime

import google.generativeai as genai
from config import settings

# ── Configure Gemini ──────────────────────────────────────────────────────────
genai.configure(api_key=settings.gemini_api_key)

# ── Language names for prompt ─────────────────────────────────────────────────
LANGUAGE_NAMES = {
    "en": "English", "hi": "Hindi", "bn": "Bengali", "ta": "Tamil",
    "te": "Telugu", "kn": "Kannada", "ml": "Malayalam", "gu": "Gujarati",
    "pa": "Punjabi", "mr": "Marathi", "ur": "Urdu", "as": "Assamese",
    "or": "Odia", "sa": "Sanskrit", "ne": "Nepali", "sd": "Sindhi",
    "kok": "Konkani", "mai": "Maithili", "doi": "Dogri", "mni": "Manipuri",
    "sat": "Santali", "ks": "Kashmiri", "bo": "Bodo",
}

# ── Mode-specific prompt extensions ───────────────────────────────────────────
MODE_PROMPTS = {
    "general": "",
    "journey": """
SPECIAL MODE: JOURNEY PLANNER
You are in Journey Planning mode. For EVERY query:
1. ALWAYS provide 3 journey options: 🟢 Cheapest, 🔵 Fastest, 🟡 Most Comfortable
2. For each option show step-by-step segments with transport mode emoji (🚶 🚌 🚇 🛺 🚕 🚂)
3. Show time + cost per segment AND totals
4. Include walking distances between connections
5. Mention estimated arrival time
6. Compare total costs across options in a summary
""",
    "fare": """
SPECIAL MODE: FARE COMPARE
You are in Fare Comparison mode. For EVERY query:
1. Compare fares across ALL relevant transport modes (bus, metro, auto, cab, train)
2. Show a clear comparison table format
3. Include distance, estimated time, and fare for each mode
4. Highlight the cheapest and fastest options
5. Mention any discounts (metro pass, bus pass estimates)
6. If the user asks about a route, estimate fares for all modes for that route
""",
    "nearby": """
SPECIAL MODE: NEARBY EXPLORER
You are in Nearby Explorer mode. For EVERY query:
1. Find ALL nearby transport options: bus stops, metro stations, railway stations, auto stands
2. Show distance and walking time for each
3. Group by type (Bus, Metro, Railway, Auto)
4. Suggest which stop to use based on the user's likely destination
5. Include what routes/lines are available from each stop
""",
    "schedule": """
SPECIAL MODE: SCHEDULE CHECKER
You are in Schedule mode. For EVERY query:
1. Show upcoming arrivals for the nearest stops
2. Group by transport type
3. Show frequency information (every X minutes)
4. Mention peak vs off-peak differences
5. Suggest optimal departure times
""",
    "navigate": """
SPECIAL MODE: LIVE NAVIGATOR
You are in Turn-by-Turn Navigation mode. For EVERY query:
1. Give extremely detailed step-by-step walking/driving directions
2. Include road names, landmarks, and distance for EVERY step
3. Mention notable landmarks to look for at turns
4. Use direction emojis: ⬆️ straight, ⬅️ left, ➡️ right, 🔄 U-turn
5. Include total distance and estimated time
6. If the user says something like "then what" or "next", continue from the last step
""",
}

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are Pathly, a smart, warm, and knowledgeable transport assistant for India.
You help users plan journeys across ANY Indian city using any combination of transport.

CORE RULES:
1. RESPOND IN {user_language}. The user's preferred language is {user_language}. ALWAYS respond in {user_language} ({language_code}). If the user types in a different language, still respond in {user_language}.
2. When users ask how to get somewhere, create a COMPLETE journey plan with 2-3 options combining different transport modes.
3. For each option, show: transport modes used, estimated time, estimated cost in ₹.
4. Use the tools provided to get real data — geocode places, find nearby stops, get directions, estimate fares.
5. Always mention estimated arrival time: "If you leave now, you'll arrive around [time]".
6. Be empathetic — understand the user's pain of navigating Indian cities.
7. For directions, give turn-by-turn guidance with road names, landmarks, distances per step.
8. NEVER mention that you are using tools or APIs. Just provide the information naturally.
9. Keep responses concise but informative. Use emojis and formatting for readability.

TRANSPORT KNOWLEDGE (India):
- City Bus: ₹5-40, cheapest, available everywhere, can be slow in traffic
- Metro: ₹10-60, fast in metro cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Jaipur, Lucknow, Kochi)
- Auto-rickshaw: ₹25-200, good for 1-8 km, negotiate fare or use meter
- Cab (Ola/Uber): ₹80-500+, most comfortable, door-to-door
- Local Train: ₹5-15, Mumbai (Western/Central/Harbour), Chennai (MRTS), Kolkata
- Walking: free, suggest for distances < 1 km

JOURNEY PLANNING FORMAT (when planning multi-modal trips):
Give 2-3 options labeled:
🟢 Cheapest: prioritize buses, walking, metro
🔵 Fastest: minimize time, use cab + metro combos
🟡 Comfortable: prefer cab, minimal walking

For each option show:
- Step-by-step segments with transport mode emoji (🚶 🚌 🚇 🛺 🚕 🚂)
- Time per segment
- Cost per segment
- Total time and total cost
- Walking distances between connections

CURRENT TIME: {current_time}
USER LOCATION: {location_info}
{mode_prompt}"""

# ── Tool declarations for function calling ────────────────────────────────────
TOOL_DECLARATIONS = [
    {
        "name": "geocode",
        "description": "Convert a place name to latitude and longitude coordinates. Use this when you need coordinates for a place the user mentions.",
        "parameters": {
            "type": "object",
            "properties": {
                "place_name": {
                    "type": "string",
                    "description": "Name of the place to geocode (e.g., 'AIIMS Delhi', 'Connaught Place', 'Mumbai CST')"
                }
            },
            "required": ["place_name"]
        }
    },
    {
        "name": "get_directions",
        "description": "Get turn-by-turn driving/walking directions between two points. Returns distance, duration, and step-by-step instructions with road names.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin_lat": {"type": "number", "description": "Origin latitude"},
                "origin_lon": {"type": "number", "description": "Origin longitude"},
                "dest_lat": {"type": "number", "description": "Destination latitude"},
                "dest_lon": {"type": "number", "description": "Destination longitude"},
            },
            "required": ["origin_lat", "origin_lon", "dest_lat", "dest_lon"]
        }
    },
    {
        "name": "find_nearby_stops",
        "description": "Find bus stops, metro stations, and railway stations near given coordinates. Use to find transit options near origin or destination.",
        "parameters": {
            "type": "object",
            "properties": {
                "lat": {"type": "number", "description": "Latitude"},
                "lon": {"type": "number", "description": "Longitude"},
                "radius": {"type": "integer", "description": "Search radius in meters (default 1000)"}
            },
            "required": ["lat", "lon"]
        }
    },
    {
        "name": "estimate_fare",
        "description": "Estimate transport fare between two places based on distance. Returns fare in INR for the specified mode.",
        "parameters": {
            "type": "object",
            "properties": {
                "mode": {
                    "type": "string",
                    "description": "Transport mode: 'bus', 'metro', 'auto', 'cab', 'train'",
                    "enum": ["bus", "metro", "auto", "cab", "train"]
                },
                "distance_km": {
                    "type": "number",
                    "description": "Approximate distance in km"
                }
            },
            "required": ["mode", "distance_km"]
        }
    },
    {
        "name": "get_schedule",
        "description": "Get upcoming transport schedule at nearby stops. Returns next bus, metro, train arrivals.",
        "parameters": {
            "type": "object",
            "properties": {
                "lat": {"type": "number", "description": "Latitude"},
                "lon": {"type": "number", "description": "Longitude"}
            },
            "required": ["lat", "lon"]
        }
    },
]


# ── Tool execution ────────────────────────────────────────────────────────────
async def _execute_tool(name: str, args: dict, user_lat: float = 0, user_lon: float = 0) -> dict:
    """Execute a tool call and return the result."""
    from services.navigation import geocode, get_directions
    from services.transport import get_nearby_stops, get_fare_by_distance, get_schedule

    try:
        if name == "geocode":
            result = await geocode(args["place_name"])
            if result:
                return {"lat": result[0], "lon": result[1], "found": True}
            return {"found": False, "error": f"Could not find '{args['place_name']}'"}

        elif name == "get_directions":
            result = await get_directions(
                args["origin_lat"], args["origin_lon"],
                args["dest_lat"], args["dest_lon"],
            )
            return result

        elif name == "find_nearby_stops":
            lat = args.get("lat", user_lat)
            lon = args.get("lon", user_lon)
            radius = args.get("radius", 1000)
            stops = await get_nearby_stops(lat, lon, radius)
            return {"stops": stops}

        elif name == "estimate_fare":
            mode = args.get("mode", "bus")
            distance_km = args.get("distance_km", 5)
            fare_result = get_fare_by_distance(mode, distance_km)
            return fare_result

        elif name == "get_schedule":
            lat = args.get("lat", user_lat)
            lon = args.get("lon", user_lon)
            schedules = await get_schedule(lat, lon)
            return {"schedules": schedules}

        else:
            return {"error": f"Unknown tool: {name}"}

    except Exception as e:
        print(f"Tool execution error ({name}): {e}")
        return {"error": str(e)}


# ── Script-based language detection ───────────────────────────────────────────
def detect_language(text: str) -> str:
    """Detect language from text using Unicode script ranges."""
    for char in text:
        cp = ord(char)
        if 0x0900 <= cp <= 0x097F:
            return "hi"  # Devanagari (Hindi/Marathi)
        if 0x0980 <= cp <= 0x09FF:
            return "bn"  # Bengali
        if 0x0A00 <= cp <= 0x0A7F:
            return "pa"  # Gurmukhi (Punjabi)
        if 0x0A80 <= cp <= 0x0AFF:
            return "gu"  # Gujarati
        if 0x0B00 <= cp <= 0x0B7F:
            return "or"  # Odia
        if 0x0B80 <= cp <= 0x0BFF:
            return "ta"  # Tamil
        if 0x0C00 <= cp <= 0x0C7F:
            return "te"  # Telugu
        if 0x0C80 <= cp <= 0x0CFF:
            return "kn"  # Kannada
        if 0x0D00 <= cp <= 0x0D7F:
            return "ml"  # Malayalam
        if 0x0600 <= cp <= 0x06FF:
            return "ur"  # Arabic script (Urdu)
    return "en"


# ── Main chat function ────────────────────────────────────────────────────────
async def chat_with_gemini(
    text: str,
    lat: float = 0,
    lon: float = 0,
    history: list[dict] = None,
    language: str = "en",
    mode: str = "general",
) -> dict:
    """Send a message to Gemini with function calling and return the response.

    Returns: {"reply": str, "language": str, "intent": str, "data": dict}
    """
    if not settings.gemini_api_key:
        return {
            "reply": "Gemini API key not configured. Please add GEMINI_API_KEY to backend/.env",
            "language": "en",
            "intent": "error",
            "data": {},
        }

    # Build dynamic system prompt
    now = datetime.now().strftime("%I:%M %p, %A, %B %d, %Y")
    location_info = f"Lat {lat}, Lon {lon}" if (lat and lon) else "Not available — ask user to enable location"
    user_language = LANGUAGE_NAMES.get(language, "English")
    mode_prompt = MODE_PROMPTS.get(mode, "")

    system = SYSTEM_PROMPT.format(
        current_time=now,
        location_info=location_info,
        user_language=user_language,
        language_code=language,
        mode_prompt=mode_prompt,
    )

    try:
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=system,
            tools=[{"function_declarations": TOOL_DECLARATIONS}],
        )

        # Build conversation history for Gemini
        gemini_history = []
        if history:
            for msg in history[-10:]:  # Last 10 messages for context
                role = "user" if msg.get("role") == "user" else "model"
                gemini_history.append({
                    "role": role,
                    "parts": [msg["content"]]
                })

        chat = model.start_chat(history=gemini_history)

        # Send user message
        response = await asyncio.to_thread(chat.send_message, text)

        # Handle function calling loop (max 5 rounds)
        collected_data = {}
        for _ in range(5):
            function_calls = []
            for part in response.parts:
                if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                    function_calls.append(part.function_call)

            if not function_calls:
                break

            # Execute all function calls
            function_responses = []
            for fc in function_calls:
                args = dict(fc.args) if fc.args else {}
                result = await _execute_tool(fc.name, args, lat, lon)
                collected_data[fc.name] = result

                function_responses.append(
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=fc.name,
                            response={"result": json.dumps(result, default=str)}
                        )
                    )
                )

            # Send function results back to Gemini
            response = await asyncio.to_thread(chat.send_message, function_responses)

        # Extract final text response
        reply = response.text if response.text else "I couldn't process that. Please try again."
        detected_lang = detect_language(reply)
        # Use user's preferred language if we can't detect from response
        final_language = detected_lang if detected_lang != "en" else language

        # Determine intent from tool calls
        intent = "chat"
        if "get_directions" in collected_data:
            intent = "route"
        elif "estimate_fare" in collected_data:
            intent = "fare"
        elif "find_nearby_stops" in collected_data:
            intent = "nearby"
        elif "get_schedule" in collected_data:
            intent = "schedule"
        elif "geocode" in collected_data:
            intent = "route"

        return {
            "reply": reply,
            "language": final_language,
            "intent": intent,
            "data": collected_data,
        }

    except Exception as e:
        print(f"Gemini error: {e}")
        # Fallback to regex-based system
        return await _fallback_chat(text, lat, lon)


async def _fallback_chat(text: str, lat: float, lon: float) -> dict:
    """Fallback to regex-based system when Gemini is unavailable."""
    from services.intent import classify_intent
    from services.transport import get_next_bus, get_fare, get_nearby_stops, get_schedule
    from services.navigation import get_directions, geocode
    from services.response import (
        format_eta_response, format_fare_response, format_nearby_response,
        format_route_response, format_schedule_response, format_unknown_response,
    )

    intent = classify_intent(text)
    intent_type = intent["type"]
    dest = intent.get("destination")
    transport_mode = intent.get("transport_mode")
    has_location = lat != 0 and lon != 0

    reply = ""
    data = {}

    if intent_type == "eta":
        bus_data = await get_next_bus(lat, lon) if has_location else {"route": "Local Bus", "eta_minutes": "unknown", "stop": "your area", "destination": ""}
        reply = format_eta_response(bus_data)
        data = bus_data
    elif intent_type == "fare":
        fare_data = await get_fare("your location", dest or "destination", mode=transport_mode, raw_query=text)
        reply = format_fare_response(fare_data)
        data = fare_data
    elif intent_type == "nearby":
        stops = await get_nearby_stops(lat, lon) if has_location else []
        reply = format_nearby_response(stops)
        data = {"stops": stops}
    elif intent_type == "schedule":
        schedules = await get_schedule(lat, lon) if has_location else []
        reply = format_schedule_response("your location", schedules)
        data = {"schedules": schedules}
    elif intent_type == "route" and dest:
        coords = await geocode(dest)
        if coords:
            route_data = await get_directions(lat or coords[0] - 0.01, lon or coords[1] - 0.01, coords[0], coords[1])
        else:
            route_data = {"error": f"Could not locate '{dest}'", "steps": [], "duration_min": 0, "distance_km": 0}
        reply = format_route_response(dest, route_data)
        data = route_data
    else:
        reply = format_unknown_response()

    return {"reply": reply, "language": "en", "intent": intent_type, "data": data}
