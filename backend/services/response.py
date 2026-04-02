def format_eta_response(data: dict) -> str:
    route = data.get("route", "the next bus")
    eta = data.get("eta_minutes", "a few")
    stop = data.get("stop", "your stop")
    dest = data.get("destination", "")
    reply = f"The next {route} arrives in {eta} minutes at {stop}."
    if dest:
        reply += f" It is headed towards {dest}."
    return reply


def format_fare_response(data: dict) -> str:
    fare = data.get("fare", "N/A")
    transport_type = data.get("type", "transit")
    extra = ""
    if data.get("line"):
        extra = f" on the {data['line']}"
    elif data.get("route"):
        extra = f" on {data['route']}"
    return f"The {transport_type} fare is Rs. {fare}{extra}. That is for a single journey."


def format_nearby_response(stops: list) -> str:
    if not stops:
        return "No nearby stops found. Try enabling location access and asking again."
    nearest = stops[0]
    reply = f"The nearest stop is {nearest['name']}, about {nearest['distance_m']} metres away."
    if len(stops) > 1:
        others = ", ".join(s["name"] for s in stops[1:3])
        reply += f" Other options nearby are {others}."
    return reply


def format_route_response(dest: str, data: dict) -> str:
    if data.get("error"):
        return f"Could not find a route to {dest} right now. Try again in a moment."
    mins = data.get("duration_min", "?")
    km = data.get("distance_km", "?")
    reply = f"Route to {dest} is about {mins} minutes and {km} km."
    steps = data.get("steps", [])
    if steps:
        reply += f" Start by: {steps[0]}"
    return reply


def format_schedule_response(stop: str, schedules: list) -> str:
    if not schedules:
        return f"No upcoming buses found at {stop} right now."
    lines = [
        f"- {s['route']} to {s['destination']} in {s['eta_minutes']} min"
        for s in schedules[:4]
    ]
    return f"Upcoming buses at {stop}:\n" + "\n".join(lines)


def format_unknown_response() -> str:
    return (
        "I can help with transport around Delhi. Try asking things like:\n"
        "- When is the next bus?\n"
        "- How do I get to Connaught Place?\n"
        "- What is the metro fare to AIIMS?\n"
        "- Show stops near me"
    )
