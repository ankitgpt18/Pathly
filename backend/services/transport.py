import random

BUS_ROUTES = [
    {"route": "Bus 47", "stops": ["MG Road", "Civil Lines", "Chandni Chowk", "Red Fort"], "fare_base": 15},
    {"route": "Bus 423", "stops": ["Connaught Place", "India Gate", "Lodhi Garden", "AIIMS"], "fare_base": 20},
    {"route": "Bus 181", "stops": ["Nehru Place", "GK-1", "Hauz Khas", "IIT Delhi"], "fare_base": 15},
    {"route": "DTC 764", "stops": ["Kashmere Gate", "Chandni Chowk", "Jama Masjid", "Delhi Gate"], "fare_base": 10},
    {"route": "Bus 534", "stops": ["Noida Sec 62", "Botanical Garden", "Okhla", "Nehru Place"], "fare_base": 25},
]

METRO_LINES = [
    {"line": "Blue Line", "stations": ["Dwarka", "Rajiv Chowk", "Noida City Centre"], "fare_range": (20, 60)},
    {"line": "Yellow Line", "stations": ["Samaypur Badli", "Rajiv Chowk", "HUDA City Centre"], "fare_range": (20, 50)},
    {"line": "Red Line", "stations": ["Rithala", "Kashmere Gate", "Shaheed Sthal"], "fare_range": (15, 40)},
    {"line": "Violet Line", "stations": ["Kashmere Gate", "Mandi House", "Badarpur Border"], "fare_range": (15, 45)},
    {"line": "Green Line", "stations": ["Mundka", "Kirti Nagar", "Brigadier Hoshiar Singh"], "fare_range": (15, 35)},
]

STOPS_DB = [
    {"name": "MG Road Bus Stand", "lat": 28.6315, "lon": 77.2167},
    {"name": "Civil Lines Metro Station", "lat": 28.6806, "lon": 77.2221},
    {"name": "Connaught Place Bus Stop", "lat": 28.6315, "lon": 77.2195},
    {"name": "India Gate Bus Stand", "lat": 28.6129, "lon": 77.2295},
    {"name": "Rajiv Chowk Metro", "lat": 28.6328, "lon": 77.2197},
    {"name": "Kashmere Gate ISBT", "lat": 28.6667, "lon": 77.2289},
    {"name": "Nehru Place Bus Terminal", "lat": 28.5494, "lon": 77.2529},
    {"name": "Hauz Khas Metro Station", "lat": 28.4996, "lon": 77.2069},
    {"name": "AIIMS Metro Station", "lat": 28.5679, "lon": 77.2078},
    {"name": "Botanical Garden Metro", "lat": 28.5645, "lon": 77.3340},
]


async def get_next_bus(stop_id: str) -> dict:
    route = random.choice(BUS_ROUTES)
    eta = random.randint(3, 18)
    stop = random.choice(route["stops"])
    return {
        "route": route["route"],
        "eta_minutes": eta,
        "stop": stop,
        "destination": route["stops"][-1],
    }


async def get_fare(origin: str, destination: str) -> dict:
    is_metro = any(
        keyword in (origin + destination).lower()
        for keyword in ["metro", "station", "line"]
    )
    if is_metro:
        line = random.choice(METRO_LINES)
        fare = random.randint(line["fare_range"][0], line["fare_range"][1])
        return {
            "fare": fare,
            "currency": "INR",
            "type": "metro",
            "line": line["line"],
        }
    else:
        route = random.choice(BUS_ROUTES)
        return {
            "fare": route["fare_base"] + random.randint(0, 15),
            "currency": "INR",
            "type": "bus",
            "route": route["route"],
        }


async def get_nearby_stops(lat: float, lon: float) -> list:
    results = []
    for stop in STOPS_DB:
        dlat = abs(stop["lat"] - lat) * 111000
        dlon = abs(stop["lon"] - lon) * 111000 * 0.7
        dist = int((dlat**2 + dlon**2) ** 0.5)
        results.append({"name": stop["name"], "distance_m": dist})
    results.sort(key=lambda x: x["distance_m"])
    return results[:5]


async def get_schedule(stop_name: str) -> list:
    schedules = []
    for _ in range(4):
        route = random.choice(BUS_ROUTES)
        schedules.append({
            "route": route["route"],
            "eta_minutes": random.randint(2, 25),
            "destination": route["stops"][-1],
        })
    schedules.sort(key=lambda x: x["eta_minutes"])
    return schedules
