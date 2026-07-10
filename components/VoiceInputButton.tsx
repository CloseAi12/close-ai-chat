"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputButtonProps {
  onResult: (transcript: string) => void;
  lang: string;
}

/**
 * Speech-to-text button backed by the browser's Web Speech API.
 * Works in Chrome/Edge (webkitSpeechRecognition). Falls back to a
 * disabled state with a tooltip in browsers without support (e.g. Firefox).
 */
export default function VoiceInputButton({ onResult, lang }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = lang;
  }, [lang]);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={!supported}
      title={
        supported
          ? listening
            ? "Recording… tap to stop"
            : "Speak your message"
          : "Voice input not supported in this browser"
      }
      aria-label="Voice input"
      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
        listening
          ? "bg-red-500 text-white animate-pulse"
          : "text-muted-light dark:text-muted-dark hover:bg-line-light dark:hover:bg-line-dark"
      } ${!supported ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {listening ? <MicOff size={17} /> : <Mic size={17} />}
    </button>
  );
}
