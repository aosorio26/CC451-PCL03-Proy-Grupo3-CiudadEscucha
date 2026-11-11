import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { useApp } from "./context";
import { captureSpeech } from "./speech-capture";
export function Dictate({ onText, onComplete, label = "Dictar" }) {
  const [listening, setListening] = useState(false),
    [error, setError] = useState("");
  const session = useRef(null);
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  useEffect(() => () => session.current?.abort(), []);
  function start() {
    setError("");
    setListening(true);
    session.current = captureSpeech({
      Speech,
      onText,
      onFinish: (text) => {
        setListening(false);
        onText(text);
        onComplete?.(text);
      },
      onError: (code) => {
        setListening(false);
        setError(
          code === "not-allowed"
            ? "Autoriza el micrófono para dictar."
            : "La escucha se interrumpió. El texto capturado sigue disponible.",
        );
      },
    });
  }
  return (
    <div className="voice">
      <button
        type="button"
        className="secondary"
        disabled={!Speech}
        onClick={() => (listening ? session.current?.finish() : start())}
      >
        {listening ? <Square size={17} /> : <Mic size={17} />}{" "}
        {listening ? "Terminar dictado" : label}
      </button>
      <small role="status">
        {listening
          ? "Habla con calma. Pulsa Terminar dictado cuando acabes (hasta 2 minutos)."
          : !Speech
            ? "Dictado no disponible en este navegador."
            : "Tu voz se convierte en texto editable."}
      </small>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function Speak({ text }) {
  const { prefs } = useApp();
  const [error, setError] = useState("");
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  return (
    <span className="actions">
      <button
        type="button"
        className="text-button"
        disabled={!window.speechSynthesis}
        onClick={() => {
          try {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = "es-PE";
            u.rate = prefs.rate || 1;
            u.volume = prefs.volume ?? 1;
            u.voice =
              speechSynthesis.getVoices().find((v) => v.name === prefs.voice) ||
              null;
            u.onerror = () =>
              setError(
                "La voz no está disponible; lee la respuesta en pantalla.",
              );
            speechSynthesis.speak(u);
          } catch {
            setError("La voz no está disponible.");
          }
        }}
      >
        <Volume2 size={16} /> Leer respuesta
      </button>
      <button
        type="button"
        className="text-button"
        onClick={() => speechSynthesis?.cancel()}
      >
        Detener voz
      </button>
      {error && <small role="status">{error}</small>}
    </span>
  );
}
