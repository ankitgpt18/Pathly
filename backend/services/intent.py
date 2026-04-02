import re

INTENT_PATTERNS = {
    "route": [
        r"(route|directions?|how\s+(do\s+i|to)\s+get|navigate|take\s+me\s+to|go\s+to|going\s+to|way\s+to|path\s+to|fastest\s+(route|way))",
    ],
    "eta": [
        r"(when|eta|how\s+long|arriv|next\s+(bus|train|metro)|schedule|departure|timing|timetable|upcoming)",
    ],
    "fare": [
        r"(fare|cost|price|how\s+much|ticket|charge|fee|rate|metro\s+fare|bus\s+fare)",
    ],
    "nearby": [
        r"(nearest|nearby|closest|near\s+me|bus\s+stop|station\s+near|stops?\s+near|around\s+me|local\s+stop)",
    ],
}

DESTINATION_PATTERNS = [
    r"to\s+(?:the\s+)?(.+?)(?:\?|$|\.)",
    r"(?:near|around|at)\s+(?:the\s+)?(.+?)(?:\?|$|\.)",
    r"(?:from|between)\s+(.+?)\s+(?:to|and)\s+(.+?)(?:\?|$|\.)",
]


def classify_intent(text: str) -> dict:
    t = text.lower().strip()

    best_intent = "unknown"
    best_score = 0

    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, t)
            score = len(matches)
            if score > best_score:
                best_score = score
                best_intent = intent

    destination = None
    for pattern in DESTINATION_PATTERNS:
        match = re.search(pattern, t)
        if match:
            destination = match.group(1).strip()
            destination = re.sub(r"^(please|can you|could you|i want to)\s+", "", destination)
            break

    origin = None
    from_match = re.search(r"from\s+(?:the\s+)?(.+?)\s+to\s+", t)
    if from_match:
        origin = from_match.group(1).strip()

    return {
        "type": best_intent,
        "destination": destination,
        "origin": origin,
        "raw": text,
        "confidence": min(best_score / 2, 1.0),
    }
