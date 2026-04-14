from datetime import datetime, timedelta


def format_eta_response(data: dict) -> str:
    route = data.get("route", "the next bus")
    eta = data.get("eta_minutes", "a few")
    stop = data.get("stop", "your nearest stop")
    dest = data.get("destination", "")
    reply = f"The next {route} arrives in about {eta} minutes at {stop}."
    if dest and dest != "Check local schedule":
        reply += f" It is headed towards {dest}."
    return reply


def format_fare_response(data: dict) -> str:
    fare = data.get("fare", "N/A")
    transport_type = data.get("type", "transit")
    note = data.get("note", "")
    extra = ""
    if data.get("line"):
        extra = f" on the {data['line']}"
    elif data.get("route"):
        extra = f" on {data['route']}"
    reply = f"The estimated {transport_type} fare is ₹{fare}{extra}."
    if note:
        reply += f" ({note})"
    return reply


def format_nearby_response(stops: list) -> str:
    if not stops:
        return "No nearby stops found. Try enabling location access for better results."
    nearest = stops[0]
    stop_type = nearest.get("type", "stop")
    type_label = {
        "bus_stop": "bus stop",
        "bus_station": "bus station",
        "metro": "metro station",
        "railway": "railway station",
    }.get(stop_type, "stop")
    reply = f"The nearest {type_label} is {nearest['name']}, about {nearest['distance_m']}m away."
    if len(stops) > 1:
        others = ", ".join(f"{s['name']} ({s['distance_m']}m)" for s in stops[1:3])
        reply += f" Other options: {others}."
    return reply


def _format_arrival_time(duration_min: int) -> str:
    """Calculate and format arrival time as 'around HH:MM AM/PM'."""
    now = datetime.now()
    arrival = now + timedelta(minutes=duration_min)
    return arrival.strftime("%I:%M %p").lstrip("0")


def format_route_response(dest: str, data: dict) -> str:
    """Format route response with Google Maps-style turn-by-turn directions."""
    if data.get("error"):
        return f"Could not find a route to {dest} right now. Try again or check the place name."

    mins = data.get("duration_min", "?")
    km = data.get("distance_km", "?")
    steps = data.get("steps", [])

    # Header with distance and time
    reply = f"🗺️ Route to {dest}\n"
    reply += f"📏 {km} km · ⏱️ ~{mins} minutes\n"

    # Real-time arrival estimate
    if isinstance(mins, (int, float)) and mins > 0:
        arrival = _format_arrival_time(int(mins))
        reply += f"\n🕐 If you leave now, you'll arrive around {arrival}.\n"

    # Turn-by-turn directions
    if steps:
        reply += "\nTurn-by-turn directions:\n"
        for i, step in enumerate(steps, 1):
            # Handle both old format (string) and new format (dict)
            if isinstance(step, str):
                reply += f"{i}. {step}\n"
                continue

            emoji = step.get("emoji", "▶️")
            instruction = step.get("instruction", "Continue")
            distance_text = step.get("distance_text", "")
            road = step.get("road", "")

            # Build the step line
            line = f"{i}. {emoji} {instruction}"
            if road and road not in instruction:
                line += f" on {road}"
            if distance_text and step.get("type") != "arrive":
                line += f" ({distance_text})"
            reply += line + "\n"
    else:
        reply += "\nDetailed turn-by-turn directions are not available for this route."

    return reply


def format_schedule_response(stop: str, schedules: list) -> str:
    if not schedules:
        return "No upcoming transport found near your location right now."
    lines = [
        f"- {s['route']} at {s['stop']} in {s['eta_minutes']} min"
        for s in schedules[:5]
    ]
    return "Upcoming transport near you:\n" + "\n".join(lines)


def format_unknown_response() -> str:
    return (
        "I can help with transport across India. Try asking:\n"
        "- How do I get to Mumbai Central?\n"
        "- What is the metro fare to AIIMS?\n"
        "- Show nearby stops\n"
        "- When is the next bus?\n"
        "- Metro schedule"
    )
