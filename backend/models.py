from pydantic import BaseModel


class ChatRequest(BaseModel):
    text: str
    lat: float | None = None
    lon: float | None = None


class ChatResponse(BaseModel):
    reply: str
    intent: str
    data: dict | None = None


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
