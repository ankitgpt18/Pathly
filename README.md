<p align="center">
  <img src="screenshot/logo.png" alt="Pathly Logo" width="180" />
</p>

# Pathly

Voice Controlled Transport AI

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

Pathly is a voice-controlled transport assistant for navigating public transit across India. You can ask about bus timings, metro fares, nearby stops, and directions using your voice or by typing in 13+ Indian languages. It has interactive route maps, multiple chat modes, and works on both desktop and mobile.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| Voice | Web Speech API (STT), SpeechSynthesis (TTS), Vosk (offline STT) |
| Maps | Leaflet.js, OpenStreetMap, CartoDB Voyager tiles |
| Backend | FastAPI, Uvicorn, Gemini 2.5 Flash |
| Routing | OSRM (open-source routing engine) |
| Geocoding | Nominatim (OpenStreetMap) |
| Transit | Overpass API |

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
echo "GEMINI_API_KEY=your_key_here" > .env
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

## Chat Modes

| Mode | Description |
|------|-------------|
| Chat | General transport queries |
| Journey | Multi-modal trip planning with cheapest, fastest, and comfortable options |
| Fares | Compare fares across bus, metro, auto, cab, train |
| Navigate | Turn-by-turn walking and driving directions |
| Schedule | Upcoming bus, metro, train arrivals |

## Languages

English, Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Marathi, Urdu, Odia, Assamese

## What You Can Ask

- How do I get to Connaught Place?
- What is the metro fare to AIIMS?
- Show bus stops near me
- Compare all fares to the airport
- Navigate me to the railway station
- When is the next bus?

## Audio and Signal Processing

This project is built around a real-time audio processing pipeline. The full breakdown is in [ASP_REPORT.md](ASP_REPORT.md), covering the dual-engine STT system, audio format conversion pipeline, multilingual TTS, voice activity detection, and WebSocket streaming architecture.

## License

MIT
