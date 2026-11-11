import {useMascot,MascotPicker} from "./Mascots";
import React, { useState } from "react";
import { useApp } from "./context";
import { api } from "./api";
import { Dictate } from "./Voice";
import { ReportForm } from "./Reports";
export default function QuickReport() {
  const pet=useMascot();
  const { config, prefs, act } = useApp();
  const [text, setText] = useState(""),
    [draft, setDraft] = useState(null),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <>
      <section className="panel">
        <img className="chat-mascot" src={pet.image} alt={pet.name}/><h1>Cuéntalo una vez. Ajústalo a tu manera.</h1><MascotPicker disabled={busy}/>
        <p>
          Describe qué pasó y dónde. La IA prepara una propuesta; puedes
          modificar todos los campos antes de publicar.
        </p>
        <label>
          Descripción para la IA
          <textarea
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <Dictate onText={setText} />
        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          Autorizo enviar este texto al proveedor de IA
        </label>
        <button
          className="primary"
          disabled={!pet.available || !consent || !text.trim() || busy}
          onClick={async () => {
            setBusy(true);
            const r = await act(() =>
              api("/assistant/message", {
                method: "POST",
                body: { message: text, consent, draft: {} },
              }),
            );
            setBusy(false);
            if (r) {
              const fields = r.draft || {};
              setDraft({
                ...fields,
                district: fields.district || prefs.district,
              });
            }
          }}
        >
          {busy ? "Preparando…" : "Preparar con IA"}
        </button>
        {!pet.available && (
          <p role="status">
            El asistente no está disponible ahora. Puedes completar el reporte manualmente.
          </p>
        )}
        <button
          className="text-button"
          onClick={() =>
            setDraft({ description: text, district: prefs.district })
          }
        >
          Abrir edición rápida manual
        </button>
      </section>
      {draft && (
        <ReportForm
          key={JSON.stringify(draft)}
          assistant
          compact
          initial={{
            ...draft,
            lat: config.districts[draft.district]?.[0],
            lng: config.districts[draft.district]?.[1],
          }}
        />
      )}
    </>
  );
}
