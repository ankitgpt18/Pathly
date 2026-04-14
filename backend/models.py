from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    text: str
    lat: float | None = None
    lon: float | None = None
    history: list[ChatMessage] = []
    language: str = "en"  # User's preferred language code
    mode: str = "general"  # Chat mode: general, journey, fare, nearby, schedule, navigate


class ChatResponse(BaseModel):
    reply: str
    intent: str
    data: dict | None = None
    language: str = "en"


class TransitStop(BaseModel):
    name: str
    distance_m: int


class FareInfo(BaseModel):
    fare: int
    currency: str = "INR"
    type: str = "single"


class BusArrival(BaseModel):
    route: str
    eta_minutes: int
    stop: str


class RouteInfo(BaseModel):
    duration_min: int
    distance_km: float
    steps: list[str]
