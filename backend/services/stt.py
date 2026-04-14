"""Offline speech-to-text using Vosk.

Downloads a small Indian English model on first use (~36 MB).
All processing is fully local — no internet required after model download.
"""

import io
import os
import json
import wave
import zipfile
import struct

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_NAME = "vosk-model-small-en-in-0.4"
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_NAME)
MODEL_URL = f"https://alphacephei.com/vosk/models/{MODEL_NAME}.zip"

# Lazy-loaded model reference
_model = None


def _ensure_model():
    """Download Vosk model if not present."""
    global _model

    if _model is not None:
        return _model

    os.makedirs(MODEL_DIR, exist_ok=True)

    if not os.path.isdir(MODEL_PATH):
        print(f"[Pathly STT] Downloading Vosk model: {MODEL_NAME} (~36 MB)...")
        import urllib.request

        zip_path = os.path.join(MODEL_DIR, f"{MODEL_NAME}.zip")
        urllib.request.urlretrieve(MODEL_URL, zip_path)

        print("[Pathly STT] Extracting model...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(MODEL_DIR)
        os.remove(zip_path)
        print("[Pathly STT] Model ready.")

    from vosk import Model, SetLogLevel

    SetLogLevel(-1)  # Suppress Vosk debug output
    _model = Model(MODEL_PATH)
    print("[Pathly STT] Vosk model loaded successfully.")
    return _model


def _audio_to_wav_16k_mono(audio_bytes: bytes) -> bytes:
    """Convert incoming audio to 16kHz mono PCM WAV for Vosk.

    Handles:
    - Raw WebM/Opus from MediaRecorder (via soundfile)
    - WAV files (resampled if needed)
    - Raw PCM bytes
    """

    # Try reading with soundfile first (handles WebM, OGG, FLAC, WAV, etc.)
    try:
        import soundfile as sf
        import numpy as np

        audio_data, samplerate = sf.read(io.BytesIO(audio_bytes), dtype="float32")

        # Convert stereo to mono
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)

        # Resample to 16kHz if needed
        if samplerate != 16000:
            # Simple linear interpolation resampling
            duration = len(audio_data) / samplerate
            target_samples = int(duration * 16000)
            indices = [int(i * samplerate / 16000) for i in range(target_samples)]
            indices = [min(i, len(audio_data) - 1) for i in indices]
            audio_data = audio_data[indices]
            samplerate = 16000

        # Convert float32 to int16
        audio_data = (audio_data * 32767).astype(np.int16)

        # Write as WAV
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(16000)
            wf.writeframes(audio_data.tobytes())
        return buf.getvalue()

    except Exception:
        pass

    # Fallback: try reading as WAV directly
    try:
        buf_in = io.BytesIO(audio_bytes)
        with wave.open(buf_in, "rb") as wf:
            frames = wf.readframes(wf.getnframes())
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()

        # Convert to mono if stereo
        if n_channels == 2 and sampwidth == 2:
            samples = struct.unpack(f"<{len(frames) // 2}h", frames)
            mono = [(samples[i] + samples[i + 1]) // 2 for i in range(0, len(samples), 2)]
            frames = struct.pack(f"<{len(mono)}h", *mono)

        buf_out = io.BytesIO()
        with wave.open(buf_out, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(framerate)
            wf.writeframes(frames)
        return buf_out.getvalue()

    except Exception:
        pass

    # Last resort: treat as raw 16kHz mono PCM
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(audio_bytes)
    return buf.getvalue()


def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio bytes to text using Vosk.

    Args:
        audio_bytes: Raw audio data (WAV, WebM, OGG, or raw PCM).

    Returns:
        Transcribed text string.
    """
    model = _ensure_model()
    from vosk import KaldiRecognizer

    wav_data = _audio_to_wav_16k_mono(audio_bytes)

    buf = io.BytesIO(wav_data)
    wf = wave.open(buf, "rb")

    recognizer = KaldiRecognizer(model, wf.getframerate())
    recognizer.SetWords(False)

    text_parts = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            if result.get("text"):
                text_parts.append(result["text"])

    final = json.loads(recognizer.FinalResult())
    if final.get("text"):
        text_parts.append(final["text"])

    wf.close()
    return " ".join(text_parts).strip()
