import httpx
from datetime import datetime
from config import settings


async def get_nearby_stops(lat: float, lon: float, radius: int = 1000) -> list:
    """Query Overpass API for real bus stops, metro stations, and railway stations near the given coordinates."""
    query = f"""
    [out:json][timeout:10];
    (
      node["highway"="bus_stop"](around:{radius},{lat},{lon});
      node["railway"="station"](around:{radius},{lat},{lon});
      node["railway"="halt"](around:{radius},{lat},{lon});
      node["station"="subway"](around:{radius},{lat},{lon});
      node["amenity"="bus_station"](around:{radius},{lat},{lon});
    );
    out body 20;
    """
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                settings.overpass_url,
                data={"data": query},
                timeout=12.0,
            )
            data = r.json()

        results = []
        for el in data.get("elements", []):
            name = el.get("tags", {}).get("name", "Unnamed Stop")
            stop_lat = el.get("lat", lat)
            stop_lon = el.get("lon", lon)
            # Approximate distance in metres
            dlat = abs(stop_lat - lat) * 111000
            dlon = abs(stop_lon - lon) * 111000 * 0.85
            dist = int((dlat**2 + dlon**2) ** 0.5)
            stop_type = "bus_stop"
            tags = el.get("tags", {})
            if tags.get("railway") in ("station", "halt"):
                stop_type = "railway"
            elif tags.get("station") == "subway":
                stop_type = "metro"
            elif tags.get("amenity") == "bus_station":
                stop_type = "bus_station"

            results.append({
                "name": name,
                "distance_m": dist,
                "type": stop_type,
                "lat": stop_lat,
                "lon": stop_lon,
            })

        results.sort(key=lambda x: x["distance_m"])
        return results[:8]

    except Exception as e:
        print(f"Overpass API error: {e}")
        return _fallback_nearby(lat, lon)


def _fallback_nearby(lat: float, lon: float) -> list:
    """Fallback with deterministic nearby data if Overpass is slow or down."""
    # Use coordinate-based offsets for consistent (non-random) results
    base = int(abs(lat * 1000)) % 300 + 100
    return [
        {"name": "Nearest Bus Stop", "distance_m": base, "type": "bus_stop", "lat": lat + 0.001, "lon": lon + 0.001},
        {"name": "Nearby Metro Station", "distance_m": base + 250, "type": "metro", "lat": lat + 0.003, "lon": lon - 0.002},
        {"name": "Local Railway Station", "distance_m": base + 600, "type": "railway", "lat": lat - 0.005, "lon": lon + 0.004},
    ]


def _get_time_factor() -> dict:
    """Get schedule frequency based on current time of day."""
    hour = datetime.now().hour
    if 7 <= hour <= 10:  # Morning rush
        return {"period": "peak", "bus_freq": 5, "metro_freq": 3, "train_freq": 8}
    elif 17 <= hour <= 20:  # Evening rush
        return {"period": "peak", "bus_freq": 5, "metro_freq": 3, "train_freq": 8}
    elif 23 <= hour or hour <= 5:  # Late night
        return {"period": "late", "bus_freq": 40, "metro_freq": 0, "train_freq": 60}
    else:  # Off-peak
        return {"period": "offpeak", "bus_freq": 12, "metro_freq": 6, "train_freq": 15}


async def get_next_bus(lat: float, lon: float) -> dict:
    """Get estimated next bus arrival based on nearby stops."""
    stops = await get_nearby_stops(lat, lon, radius=500)
    bus_stops = [s for s in stops if s["type"] in ("bus_stop", "bus_station")]
    time_factor = _get_time_factor()

    if bus_stops:
        nearest = bus_stops[0]
        # Walking time + wait time based on time of day
        walk_min = max(1, nearest["distance_m"] // 80)
        wait_min = time_factor["bus_freq"]
        eta = walk_min + wait_min
        return {
            "route": f"Bus near {nearest['name']}",
            "eta_minutes": eta,
            "stop": nearest["name"],
            "destination": "Check local schedule",
            "period": time_factor["period"],
        }

    base_wait = time_factor["bus_freq"]
    return {
        "route": "Local Bus",
        "eta_minutes": base_wait + 3,
        "stop": "Nearest stop",
        "destination": "Check local schedule",
        "period": time_factor["period"],
    }


# ── Realistic fare calculation (distance-based) ──────────────────────────────
FARE_RATES = {
    "bus": {"base": 5, "per_km": 1.5, "min": 5, "max": 45, "label": "city bus", "note": "AC bus may cost 1.5x"},
    "metro": {"base": 10, "per_km": 2.5, "min": 10, "max": 60, "label": "metro", "note": "Smart card gets 10% discount"},
    "auto": {"base": 25, "per_km": 12, "min": 25, "max": 300, "label": "auto-rickshaw", "note": "Meter fare, may vary by city"},
    "cab": {"base": 50, "per_km": 14, "min": 80, "max": 800, "label": "cab (Ola/Uber)", "note": "Surge pricing may apply"},
    "train": {"base": 5, "per_km": 0.8, "min": 5, "max": 250, "label": "train (general)", "note": "Check IRCTC for exact fares"},
}


def get_fare_by_distance(mode: str, distance_km: float) -> dict:
    """Calculate fare based on actual distance. No randomness."""
    rate = FARE_RATES.get(mode, FARE_RATES["bus"])
    fare = rate["base"] + rate["per_km"] * distance_km
    fare = max(rate["min"], min(rate["max"], int(round(fare))))
    return {
        "fare": fare,
        "currency": "INR",
        "mode": mode,
        "type": rate["label"],
        "distance_km": round(distance_km, 1),
        "note": rate["note"],
    }


async def get_fare(
    origin: str,
    destination: str,
    mode: str | None = None,
    raw_query: str | None = None,
) -> dict:
    """Provide fare estimates for Indian public transport."""
    # Detect transport mode from query
    if not mode:
        search_text = ""
        if raw_query:
            search_text = raw_query.lower()
        else:
            search_text = (origin + " " + destination).lower()

        if any(kw in search_text for kw in ["metro", "subway", "underground"]):
            mode = "metro"
        elif any(kw in search_text for kw in ["train", "railway", "rail", "irctc"]):
            mode = "train"
        elif any(kw in search_text for kw in ["auto", "rickshaw"]):
            mode = "auto"
        elif any(kw in search_text for kw in ["cab", "taxi", "ola", "uber"]):
            mode = "cab"
        else:
            mode = "bus"

    # Use a default distance estimate based on typical Indian city trips
    default_distance = 8.0
    return get_fare_by_distance(mode, default_distance)


async def get_schedule(lat: float, lon: float) -> list:
    """Get schedule of upcoming transport at nearby stops."""
    stops = await get_nearby_stops(lat, lon, radius=800)
    time_factor = _get_time_factor()
    schedules = []

    transport_configs = [
        {"type": "City Bus", "freq_key": "bus_freq", "icon": "🚌"},
        {"type": "Express Bus", "freq_key": "bus_freq", "icon": "🚌"},
        {"type": "Metro", "freq_key": "metro_freq", "icon": "🚇"},
        {"type": "Local Train", "freq_key": "train_freq", "icon": "🚂"},
    ]

    for i, stop in enumerate(stops[:4]):
        config = transport_configs[i % len(transport_configs)]
        freq = time_factor[config["freq_key"]]

        if freq == 0:
            continue  # Service not running (late night)

        # Calculate deterministic ETA based on stop index and frequency
        eta = freq + (i * 2)

        schedules.append({
            "route": f"{config['icon']} {config['type']}",
            "eta_minutes": eta,
            "stop": stop["name"],
            "destination": "Terminal/End Station",
            "frequency": f"Every {freq} min",
            "period": time_factor["period"],
        })

    schedules.sort(key=lambda x: x["eta_minutes"])
    return schedules
