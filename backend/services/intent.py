import re

INTENT_PATTERNS = {
    "route": [
        r"(route|directions?|how\s+(do\s+i|to)\s+get|navigate|take\s+me\s+to|go\s+to|going\s+to|way\s+to|path\s+to|fastest\s+(route|way)|reach|travel\s+to)",
    ],
    "eta": [
        r"(when|eta|how\s+long|arriv|next\s+(bus|train|metro)|departure|timing|upcoming|coming)",
    ],
    "fare": [
        r"(fare|cost|price|how\s+much|ticket|charge|fee|rate|metro\s+fare|bus\s+fare|auto\s+fare|train\s+fare)",
    ],
    "nearby": [
        r"(nearest|nearby|closest|near\s+me|bus\s+stop|station\s+near|stops?\s+near|around\s+me|local\s+stop|near\s+here)",
    ],
    "schedule": [
        r"(schedule|timetable|time\s+table|bus\s+timings?|train\s+timings?|metro\s+timings?|what\s+time)",
    ],
}

DESTINATION_PATTERNS = [
    r"to\s+(?:the\s+)?(.+?)(?:\?|$|\.)",
    r"(?:near|around|at)\s+(?:the\s+)?(.+?)(?:\?|$|\.)",
    r"(?:from|between)\s+(.+?)\s+(?:to|and)\s+(.+?)(?:\?|$|\.)",
    r"(?:reach|visit|go)\s+(?:to\s+)?(.+?)(?:\?|$|\.)",
]

# Transport mode keywords — checked against the full raw query
TRANSPORT_MODE_MAP = {
    "metro": ["metro", "subway", "underground"],
    "bus": ["bus", "volvo", "dtc", "bmtc", "best bus", "city bus", "state bus"],
    "train": ["train", "railway", "rail", "local train", "suburban", "irctc"],
    "auto": ["auto", "rickshaw", "auto-rickshaw", "autorickshaw", "tuk tuk"],
    "cab": ["cab", "taxi", "ola", "uber"],
}


def _extract_transport_mode(text: str) -> str | None:
    """Extract transport mode from the full user query."""
    t = text.lower()
    for mode, keywords in TRANSPORT_MODE_MAP.items():
        for kw in keywords:
            if kw in t:
                return mode
    return None


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
            # Clean common filler words
            destination = re.sub(r"^(please|can you|could you|i want to|i need to)\s+", "", destination)
            # Remove transport mode words from destination so "metro fare to AIIMS" -> dest = "AIIMS" not "metro AIIMS"
            for keywords in TRANSPORT_MODE_MAP.values():
                for kw in keywords:
                    destination = re.sub(rf"^{re.escape(kw)}\s+", "", destination, flags=re.IGNORECASE)
            destination = destination.strip()
            if len(destination) > 60:
                destination = destination[:60]
            if destination:
                break

    origin = None
    from_match = re.search(r"from\s+(?:the\s+)?(.+?)\s+to\s+", t)
    if from_match:
        origin = from_match.group(1).strip()

    transport_mode = _extract_transport_mode(text)

    return {
        "type": best_intent,
        "destination": destination,
        "origin": origin,
        "transport_mode": transport_mode,
        "raw": text,
        "confidence": min(best_score / 2, 1.0),
    }
