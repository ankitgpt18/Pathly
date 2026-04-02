# Pathly

Voice Controlled Transport AI

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

Pathly is a voice-controlled transport assistant for navigating public transit in Delhi. You can ask about bus timings, metro fares, nearby stops, and directions using your voice or by typing. The interface is built around a clean chat layout with a glassmorphic design and a persistent conversation history.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Voice | Web Speech API (STT), SpeechSynthesis (TTS) |
| Backend | FastAPI, Uvicorn |
| Routing | OSRM (open-source routing engine) |
| Geocoding | Nominatim (OpenStreetMap) |

## Quick Start

Clone the repository

```bash
git clone https://github.com/ankitgpt18/Pathly.git
cd Pathly
```

Start the backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the app at `http://localhost:3000`

API docs at `http://localhost:8000/docs`

## What You Can Ask

- When is the next bus?
- How do I get to Connaught Place?
- What is the metro fare to AIIMS?
- Show bus stops near me
- Find the fastest route to the airport

## License

MIT
