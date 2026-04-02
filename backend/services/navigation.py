import httpx
from config import settings

OSRM_BASE = settings.osrm_base_url
NOMINATIM_URL = settings.nominatim_url


async def geocode(place_name: str) -> tuple[float, float] | None:
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                NOMINATIM_URL,
                params={
                    "q": f"{place_name}, Delhi, India",
                    "format": "json",
                    "limit": 1,
                },
                headers={"User-Agent": "Pathly/1.0"},
                timeout=5.0,
            )
            data = r.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None


async def get_directions(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> dict:
    url = f"{OSRM_BASE}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    params = {"overview": "false", "steps": "true"}

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, params=params, timeout=8.0)
            data = r.json()

        if data.get("code") != "Ok":
            return {"error": "Could not find route", "steps": [], "duration_min": 0, "distance_km": 0}

        leg = data["routes"][0]["legs"][0]
        steps = [
            s["maneuver"].get("instruction", "Continue")
            for s in leg["steps"]
            if "maneuver" in s
        ]

        return {
            "duration_min": round(leg["duration"] / 60),
            "distance_km": round(leg["distance"] / 1000, 1),
            "steps": steps[:6],
        }
    except Exception as e:
        print(f"OSRM error: {e}")
        return {
            "error": "Navigation service unavailable",
            "steps": [],
            "duration_min": 0,
            "distance_km": 0,
        }
