"use client";

import { useState, useCallback, useRef } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "/_/backend"
    : "http://localhost:8000");

/**
 * Language code → BCP47 locale mapping for Indian languages.
 */
const LANG_TO_LOCALE: Record<string, string> = {
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  mr: "hi-IN", // Marathi uses Devanagari, mapped to Hindi TTS
  ur: "ur-PK",
  or: "or-IN",
  as: "bn-IN", // Assamese close to Bengali in TTS
  en: "en-IN",
};

/**
 * Detect language from text using Unicode script ranges.
 */
function detectLanguageFromText(text: string): string {
  for (const char of text) {
    const cp = char.codePointAt(0) || 0;
    if (cp >= 0x0900 && cp <= 0x097f) return "hi";
    if (cp >= 0x0980 && cp <= 0x09ff) return "bn";
    if (cp >= 0x0a00 && cp <= 0x0a7f) return "pa";
    if (cp >= 0x0a80 && cp <= 0x0aff) return "gu";
    if (cp >= 0x0b00 && cp <= 0x0b7f) return "or";
    if (cp >= 0x0b80 && cp <= 0x0bff) return "ta";
    if (cp >= 0x0c00 && cp <= 0x0c7f) return "te";
    if (cp >= 0x0c80 && cp <= 0x0cff) return "kn";
    if (cp >= 0x0d00 && cp <= 0x0d7f) return "ml";
    if (cp >= 0x0600 && cp <= 0x06ff) return "ur";
  }
  return "en";
}

/**
 * Clean text for TTS — strip emojis and special characters that TTS reads literally.
 */
function cleanForTTS(text: string): string {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
      ""
    )
    .replace(/[🟢🔵🟡🔴⬅️➡️⬆️⬇️↗️↖️🔄🏁🔵▶️🗺️📏⏱️🕐]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function useSpeech(selectedLanguage: string = "en") {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /**
   * PRIMARY: Web Speech API — uses selected language for STT.
   */
  const startWebSpeech = useCallback((onResult: (text: string) => void) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;

    const recognition = new SR();
    // Use the user's selected language for accurate speech recognition
    const locale = LANG_TO_LOCALE[selectedLanguage] || "en-IN";
    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [selectedLanguage]);

  /**
   * FALLBACK: Record audio with MediaRecorder → send to backend Vosk endpoint.
   */
  const startOfflineRecording = useCallback(
    async (onResult: (text: string) => void) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        chunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          if (audioBlob.size < 100) {
            setIsListening(false);
            return;
          }

          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");
            const res = await fetch(`${API_BASE}/api/transcribe`, {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text?.trim()) onResult(data.text.trim());
            }
          } catch (err) {
            console.error("[Pathly] Transcription error:", err);
          }
          setIsListening(false);
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);
        setIsListening(true);
      } catch (err) {
        console.error("[Pathly] Microphone denied:", err);
        alert("Microphone access is required for voice input.");
        setIsListening(false);
      }
    },
    []
  );

  /**
   * Start listening — tries Web Speech API first, falls back to backend Vosk.
   */
  const startListening = useCallback(
    (onResult: (text: string) => void) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR && navigator.onLine) {
        const started = startWebSpeech(onResult);
        if (started) return;
      }
      startOfflineRecording(onResult);
    },
    [startWebSpeech, startOfflineRecording]
  );

  /**
   * Stop listening — handles both Web Speech API and MediaRecorder.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    } else {
      setIsListening(false);
    }
  }, []);

  /**
   * Text-to-Speech — speaks text aloud in the appropriate language.
   * Priority: langHint → detected from text → selectedLanguage → en-IN
   */
  const speak = useCallback((text: string, langHint?: string) => {
    if (typeof window === "undefined") return;

    window.speechSynthesis.cancel();

    const cleanText = cleanForTTS(text);
    if (!cleanText) return;

    // Detect language: hint > text detection > user selection
    const detectedLang = detectLanguageFromText(cleanText);
    const lang = langHint || (detectedLang !== "en" ? detectedLang : selectedLanguage);
    const locale = LANG_TO_LOCALE[lang] || "en-IN";

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = locale;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const exactMatch = voices.find((v) => v.lang === locale);
    const languageMatch = voices.find((v) => v.lang.startsWith(lang));
    const fallback = voices.find((v) => v.lang === "en-IN") || voices[0];

    utterance.voice = exactMatch || languageMatch || fallback;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [selectedLanguage]);

  /**
   * Stop speaking immediately.
   */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
