import {useMascot,MascotPicker,MoodChoice} from "./Mascots";
import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Send, MessageCircle, CheckCircle2 } from "lucide-react";
import { useApp } from "./context";
import { api } from "./api";
import { Dictate, Speak } from "./Voice";
import { ReportForm } from "./Reports";
import { createConversation } from "./conversation";
export default function Assistant() {
  const pet=useMascot();
  const { config, act } = useApp(),
    navigate = useNavigate();
  const [message, setMessage] = useState(""),
    [consent, setConsent] = useState(false),
    [view, setView] = useState({
      history: [],
      draft: {},
      reports: [],
      ready: false,
      busy: false,
    }),
    [edit, setEdit] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  const engine = useRef(null),
    bottom = useRef(null);
  if (!engine.current)
    engine.current = createConversation({ api, onChange: setView });
  useEffect(
    () => { bottom.current?.scrollIntoView({ block: "nearest" }); },
    [view.history.length],
  );
  async function send(e) {
    e.preventDefault();
    if (!message.trim() || view.busy) return;
    setConfirmed(false);
    const text = message;
    setMessage("");
    await act(() => engine.current.send(text, consent));
  }
  if (edit)
    return (
      <>
        <button className="secondary" onClick={() => setEdit(false)}>
          Volver a la conversación
        </button>
        <ReportForm assistant compact initial={view.draft} />
      </>
    );
  return (
    <div className="chat-product">
      <header className="chat-intro">
        <img className="chat-mascot" src={pet.image} alt={pet.name}/>
        <div>
          <p className="eyebrow">CONTIGO, PASO A PASO</p>
          <h1>Hola, soy {pet.name}</h1>
          <p>
            Describe el problema. Prepararé un borrador que podrás corregir y
            confirmar aquí.
          </p>
        </div>
      </header>
      <MascotPicker disabled={view.busy}/><MoodChoice/>
      {!pet.available && (
        <div className="notice" role="status">
          El asistente no está disponible en este momento. Puedes{" "}
          <Link to="/reportar">crear tu reporte con el formulario</Link>.
        </div>
      )}
      <section
        className="conversation product-conversation"
        role="log"
        aria-label="Conversación"
      >
        <div className="bubble">
          <p>
            Hola. ¿Quieres crear, modificar un borrador o consultar un reporte?
          </p>
        </div>
        {view.history.map((m, i) => (
          <div className={"bubble " + m.role} key={i}>
            <small>{m.role === "user" ? "Tú" : m.mascotName || pet.name}</small>
            <p>{m.text}</p>
            {m.role === "assistant" && <Speak text={m.text} />}
          </div>
        ))}
        {view.busy && <p role="status">Un momento, estoy revisando…</p>}
        <div ref={bottom} />
      </section>
      {!!view.reports.length && (
        <section className="panel">
          <h2>Reportes encontrados</h2>
          {view.reports.map((r) => (
            <Link
              className="query-result"
              key={r.id}
              to={"/incidencias/" + r.id}
            >
              <strong>{r.title}</strong>
              <span>
                {r.district} · {r.status}
              </span>
            </Link>
          ))}
        </section>
      )}
      {view.draft.title && (
        <section className="panel draft-card" aria-label="Borrador del reporte">
          <span className="eyebrow">
            {view.ready ? "LISTO PARA TU REVISIÓN" : "BORRADOR EN PROGRESO"}
          </span>
          <h2>{view.draft.title}</h2>
          <p>{view.draft.description}</p>
          <dl>
            <dt>Ubicación</dt>
            <dd>
              {view.draft.district || "Por completar"} ·{" "}
              {view.draft.address || "Falta una referencia"}
            </dd>
            <dt>Categoría</dt>
            <dd>{view.draft.category || "Por completar"}</dd>
            <dt>Urgencia</dt>
            <dd>{view.draft.urgency || "Media"}</dd>
          </dl>
          <p className="muted">
            El punto inicial es aproximado al distrito. Puedes precisarlo en el
            mapa.
          </p>
          <button
            className="secondary"
            disabled={view.busy}
            onClick={() => setEdit(true)}
          >
            Editar todos los campos y ubicación
          </button>
          {view.ready && (
            <>
              <label className="check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Revisé el borrador y quiero publicarlo
              </label>
              <button
                className="primary"
                disabled={!confirmed || view.busy}
                onClick={async () => {
                  const r = await act(
                    () => engine.current.confirm(),
                    "Reporte publicado.",
                  );
                  if (r) navigate("/incidencias/" + r.id);
                }}
              >
                <CheckCircle2 size={18} />
                Confirmar y publicar reporte
              </button>
            </>
          )}
        </section>
      )}
      <form className="panel chat-composer" onSubmit={send}>
        {pet.available && (
          <label className="check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Autorizo enviar mi texto y contexto al proveedor de IA
          </label>
        )}
        <label htmlFor="chat-text">Mensaje o transcripción editable</label>
        <textarea
          id="chat-text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={6000}
          required
          placeholder="Hay una luminaria apagada en…"
        />
        <div className="actions">
          <Dictate onText={setMessage} />
          <button
            className="primary"
            disabled={!pet.available || !consent || view.busy}
          >
            <Send size={18} />
            Enviar
          </button>
        </div>
        <Link to="/voz">Continuar en modo solo voz</Link>
      </form>
    </div>
  );
}
