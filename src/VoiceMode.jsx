import {useMascot,MascotPicker} from "./Mascots";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mic, Volume2 } from "lucide-react";
import { useApp } from "./context";
import { api } from "./api";
import { createConversation } from "./conversation";
import { captureSpeech } from "./speech-capture";
const help = "Diga: crear reporte, modificar reporte o consultar reporte.";
export default function VoiceMode() {
  const pet=useMascot();
  const { config, prefs, savePrefs, recordUse } = useApp(),
    location = useLocation(),
    [status, setStatus] = useState("Listo para escucharte"),
    [reply, setReply] = useState(help),
    [heard, setHeard] = useState(""),
    [active, setActive] = useState(false),
    [pause, setPause] = useState(prefs.voicePause || 5);
  const running = useRef(false),
    capture = useRef(null),
    timer = useRef(null),
    engine = useRef(null),
    last = useRef(help),
    consent = useRef(false),
    empty = useRef(0),
    pauseRef = useRef(5);
  pauseRef.current = pause;
  useEffect(()=>setPause(prefs.voicePause || 5),[prefs.voicePause]);
  if (!engine.current)
    engine.current = createConversation({ api, mode: "voice" });
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  function stop() {
    running.current = false;
    setActive(false);
    clearTimeout(timer.current);
    capture.current?.abort();
    window.speechSynthesis?.cancel();
    setStatus("Escucha detenida");
  }
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  function speak(text, again = true) {
    if (!window.speechSynthesis) return;
    last.current = text;
    setReply(text);
    setStatus("Escucha la respuesta");
    capture.current?.abort();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-PE";
    u.rate = prefs.rate || 1;
    u.volume = 1;
    u.onend = () => {
      if (running.current && again) timer.current = setTimeout(listen, 350);
    };
    u.onerror = () => {
      stop();
      setStatus(
        "No se pudo reproducir la voz. Revisa el audio y vuelve a activar.",
      );
    };
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  async function respond(text) {
    if (!running.current) return;
    setHeard(text);
    const n = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[.,!?¿¡]/g, "")
      .trim();
    if (/^(detener|salir|parar|no autorizo)$/.test(n)) {
      stop();
      speak("Modo de voz detenido.", false);
      return;
    }
    if (!consent.current) {
      if (/^(si|si autorizo|autorizo|acepto)$/.test(n)) {
        consent.current = true;
        speak(help);
      } else
        speak(
          "¿Autorizas enviar la conversación al servicio de inteligencia artificial? Di sí o no autorizo.",
        );
      return;
    }
    if (!n) {
      if (++empty.current > 2) {
        stop();
        speak("La escucha está en pausa.", false);
      } else speak("Te escucho.");
      return;
    }
    empty.current = 0;
    recordUse("voiceTurn");
    if (n === "repetir") {
      speak(last.current);
      return;
    }
    if (n === "ayuda" || n === "modo solo voz") {
      speak(help);
      return;
    }
    if (n === "cancelar") {
      engine.current.reset();
      speak("Borrador cancelado. " + help);
      return;
    }
    if (n === "leer borrador") {
      const d = engine.current.state().draft;
      speak(
        d.title
          ? `${d.title}. ${d.description}. ${d.district}, ${d.address}.`
          : "Aún no hay un borrador. ¿Qué ocurrió?",
      );
      return;
    }
    setStatus("Preparando respuesta…");
    try {
      if (
        /^(confirmar reporte|confirmar publicacion|publicar reporte)$/.test(n)
      ) {
        await engine.current.confirm();
        if (running.current)
          speak("Reporte publicado. Puedes consultar su estado.");
      } else {
        const r = await engine.current.send(text, true);
        if (running.current && r) speak(r.reply);
      }
    } catch (e) {
      if (running.current)
        speak(
          pet.available
            ? "No pude completar la acción. Puedes repetir o cancelar."
            : "El asistente no está disponible. Inténtalo más tarde.",
        );
    }
  }
  function listen() {
    if (!running.current) return;
    setStatus("Escuchando. Habla con calma.");
    capture.current = captureSpeech({
      Speech,
      silenceMs: pauseRef.current * 1000,
      maxMs: 120000,
      onText: setHeard,
      onFinish: respond,
      onError: (code) => {
        recordUse("voiceError");
        stop();
        speak(
          code === "not-allowed"
            ? "Autoriza el micrófono en el navegador."
            : "No pude continuar escuchando. Revisa tu micrófono y conexión.",
          false,
        );
      },
    });
  }
  function activate() {
    if (!pet.available) {
      speak("El asistente no está disponible en este momento.", false);
      return;
    }
    running.current = true;
    setActive(true);
    if (consent.current) speak(help);
    else
      speak(
        "¿Autorizas enviar la conversación al servicio de inteligencia artificial? Di sí o no autorizo.",
      );
  }
  useEffect(() => {
    if (location.state?.startVoice && Speech && window.speechSynthesis)
      activate();
  }, []);
  return (
    <section className="panel voice-mode">
      <img className="voice-mascot" src={pet.image} alt={pet.name}/>
      <p className="eyebrow">ASISTENTE POR VOZ</p>
      <h1>{pet.name} te escucha</h1>
      <MascotPicker disabled={active}/>
      <p>{help}</p>
      <button
        className="primary wide"
        disabled={!Speech || !window.speechSynthesis}
        onClick={() => (active ? stop() : activate())}
      >
        {active ? "Detener modo de voz" : "Activar modo de voz"}
      </button>
      {!pet.available && (
        <p role="status">El asistente no está disponible en este momento.</p>
      )}
      <p role="status">{status}</p>
      <div className="voice-transcript">
        <small>Tú dijiste</small>
        <p>{heard || "Te escuchamos…"}</p>
        <small>
          <Volume2 size={16} /> Asistente
        </small>
        <p>{reply}</p>
      </div>
      <label>
        Tiempo para terminar tu frase
        <select
          value={pause}
          onChange={(e) => {setPause(Number(e.target.value));savePrefs({...prefs,voicePause:Number(e.target.value)});}}
        >
          <option value={3}>3 segundos de silencio</option>
          <option value={5}>5 segundos de silencio</option>
          <option value={8}>8 segundos de silencio</option>
        </select>
      </label>
      <details>
        <summary>Ayuda y privacidad</summary>
        <p>
          Cuenta el problema con tus palabras. La IA prepara el borrador y lee
          un resumen. Di «leer borrador» para escucharlo completo, explica lo
          que quieres cambiar o di «confirmar reporte». Nunca se publica sin
          confirmación.
        </p>
        <p>
          El micrófono y la IA requieren conexión. Puedes decir repetir,
          cancelar o detener. La escucha se detiene al salir de la app.
        </p>
      </details>
      <label className="check">
        <input
          type="checkbox"
          checked={!!prefs.voiceMode}
          onChange={(e) => savePrefs({ ...prefs, voiceMode: e.target.checked })}
        />
        Abrir este modo al iniciar sesión
      </label>
      <Link to="/asistente">Abrir conversación escrita</Link>
    </section>
  );
}
