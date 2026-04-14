import httpx
from config import settings

OSRM_BASE = settings.osrm_base_url
NOMINATIM_URL = settings.nominatim_url

# Maneuver type → direction emoji mapping
_DIRECTION_EMOJI = {
    "turn-left": "⬅️",
    "turn-right": "➡️",
    "turn-slight-left": "↖️",
    "turn-slight-right": "↗️",
    "turn-sharp-left": "⤴️",
    "turn-sharp-right": "⤵️",
    "uturn": "🔄",
    "straight": "⬆️",
    "depart": "🔵",
    "arrive": "🏁",
    "roundabout": "🔄",
    "rotary": "🔄",
    "merge": "↗️",
    "fork-left": "↖️",
    "fork-right": "↗️",
    "ramp-left": "↖️",
    "ramp-right": "↗️",
    "continue": "⬆️",
    "end of road-left": "⬅️",
    "end of road-right": "➡️",
}


def _format_distance(meters: float) -> str:
    """Format distance in human-readable form."""
    if meters < 100:
        return f"{int(meters)}m"
    elif meters < 1000:
        return f"{int(round(meters, -1))}m"
    else:
        return f"{round(meters / 1000, 1)} km"


def _get_direction_emoji(modifier: str, maneuver_type: str) -> str:
    """Get appropriate emoji for a maneuver."""
    key = f"{maneuver_type}-{modifier}" if modifier else maneuver_type
    return _DIRECTION_EMOJI.get(key, _DIRECTION_EMOJI.get(maneuver_type, "▶️"))


async def geocode(place_name: str) -> tuple[float, float] | None:
    """Geocode a place name to lat/lon coordinates, searching across all of India."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                NOMINATIM_URL,
                params={
                    "q": place_name,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "in",
                },
                headers={"User-Agent": "Pathly/1.0"},
                timeout=8.0,
            )
            data = r.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None


async def reverse_geocode(lat: float, lon: float) -> dict:
    """Reverse geocode coordinates to get city/state information."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                settings.nominatim_reverse_url,
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "zoom": 10,
                },
                headers={"User-Agent": "Pathly/1.0"},
                timeout=5.0,
            )
            data = r.json()
            addr = data.get("address", {})
            return {
                "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county"),
                "state": addr.get("state"),
                "display": data.get("display_name", ""),
            }
    except Exception as e:
        print(f"Reverse geocoding error: {e}")
    return {"city": None, "state": None, "display": ""}


async def get_directions(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> dict:
    """Get turn-by-turn directions via OSRM with route geometry for map display."""
    url = f"{OSRM_BASE}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    params = {"overview": "full", "steps": "true", "geometries": "geojson"}

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, params=params, timeout=10.0)
            data = r.json()

        if data.get("code") != "Ok":
            return {"error": "Could not find route", "steps": [], "duration_min": 0, "distance_km": 0}

        route = data["routes"][0]
        leg = route["legs"][0]
        total_duration_sec = leg["duration"]
        total_distance_m = leg["distance"]

        # Extract route geometry for map display
        geometry = route.get("geometry", {})
        coordinates = geometry.get("coordinates", [])

        steps = []
        for s in leg["steps"]:
            if "maneuver" not in s:
                continue

            maneuver = s["maneuver"]
            instruction = maneuver.get("instruction", "Continue")
            maneuver_type = maneuver.get("type", "continue")
            modifier = maneuver.get("modifier", "")
            step_distance = s.get("distance", 0)
            step_duration = s.get("duration", 0)
            road_name = s.get("name", "")

            emoji = _get_direction_emoji(modifier, maneuver_type)

            steps.append({
                "instruction": instruction,
                "distance_m": round(step_distance),
                "distance_text": _format_distance(step_distance),
                "duration_sec": round(step_duration),
                "road": road_name,
                "emoji": emoji,
                "type": maneuver_type,
            })

        return {
            "duration_min": round(total_duration_sec / 60),
            "duration_sec": round(total_duration_sec),
            "distance_km": round(total_distance_m / 1000, 1),
            "distance_m": round(total_distance_m),
            "steps": steps[:12],
            "origin": {"lat": origin_lat, "lon": origin_lon},
            "destination": {"lat": dest_lat, "lon": dest_lon},
            "geometry": coordinates,  # GeoJSON coordinates for map
        }
    except Exception as e:
        print(f"OSRM error: {e}")
        return {
            "error": "Navigation service unavailable",
            "steps": [],
            "duration_min": 0,
            "distance_km": 0,
        }
