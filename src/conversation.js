// Shared by text chat and hands-free voice. The model never publishes directly.
export function createConversation({
  api,
  mode = "text",
  onChange = () => {},
}) {
  let draft = {},
    ready = false,
    history = [],
    prepared = null,
    reports = [],
    busy = false,
    published = null;
  const state = () => ({
    draft: { ...draft },
    ready,
    history: [...history],
    reports: [...reports],
    busy,
    published,
  });
  const emit = () => onChange(state());
  const summary = () =>
    `${draft.title}. ${draft.district}, ${draft.address}. ${draft.category}. Urgencia ${draft.urgency}. Ubicación aproximada al distrito; puedes ajustarla. Di confirmar reporte o qué deseas cambiar.`;
  async function send(message, consent) {
    if (busy) return null;
    busy = true;
    emit();
    const previous = history
      .slice(-8)
      .map(({ role, text }) => ({ role, text }));
    history.push({ role: "user", text: message });
    emit();
    try {
      const result = await api("/assistant/message", {
        method: "POST",
        body: { message, draft, consent, mode, conversation: previous },
      });
      const changed =
        JSON.stringify(draft) !== JSON.stringify(result.draft || draft);
      draft = result.draft || draft;
      ready = !!result.ready;
      if (changed) prepared = null;
      reports = result.reports || [];
      const text =
        mode === "voice" && ready && result.intent !== "query"
          ? summary()
          : result.reply;
      history.push({ role: "assistant", text, mascotName:result.mascotName });
      emit();
      return { ...result, reply: text };
    } finally {
      busy = false;
      emit();
    }
  }
  async function confirm() {
    if (busy) throw Error("Espera a que termine la consulta.");
    if (!ready) throw Error("Primero completemos el borrador.");
    busy = true;
    emit();
    try {
      prepared ||= await api("/assistant/drafts", {
        method: "POST",
        body: draft,
      });
      const r = await api("/assistant/drafts/" + prepared.id + "/confirm", {
        method: "POST",
        body: { confirmed: true },
      });
      published = r;
      ready = false;
      draft = {};
      prepared = null;
      history.push({
        role: "assistant",
        text: "Reporte publicado. Puedes seguir su estado desde Mis reportes.",
      });
      emit();
      return r;
    } finally {
      busy = false;
      emit();
    }
  }
  function reset() {
    if (busy) return;
    draft = {};
    ready = false;
    prepared = null;
    reports = [];
    published = null;
    emit();
  }
  return { send, confirm, reset, state, summary };
}
