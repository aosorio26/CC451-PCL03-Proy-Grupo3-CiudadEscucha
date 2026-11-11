import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { captureSpeech } from "./speech-capture";
export default function MenuVoice({ onClose }) {
  const navigate = useNavigate(),
    session = useRef(null),
    [text, setText] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      setError(
        "Este navegador no permite dictado. Puedes abrir el modo de voz desde el menú.",
      );
      return;
    }
    session.current = captureSpeech({
      Speech,
      silenceMs: 3000,
      onText: setText,
      onFinish: (t) => {
        setText(t);
        if (/modo\s+solo\s+voz/i.test(t)) {
          onClose();
          navigate("/voz", { state: { startVoice: true } });
        } else setError("Di «Modo Solo Voz» o abre la conversación escrita.");
      },
      onError: () =>
        setError("No pudimos escuchar. Revisa el permiso del micrófono."),
    });
    return () => session.current?.abort();
  }, []);
  return (
    <div>
      <p>
        Di <strong>Modo Solo Voz</strong> para hablar con el asistente.
      </p>
      <p role="status">{text || "Escuchando…"}</p>
      {error && <p role="alert">{error}</p>}
      <button className="secondary" onClick={() => session.current?.finish()}>
        Terminé de hablar
      </button>
      <button
        className="text-button"
        onClick={() => {
          onClose();
          navigate("/voz");
        }}
      >
        Abrir modo solo voz
      </button>
    </div>
  );
}
