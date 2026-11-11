// Accumulate every result segment. Browsers may end a session; resume without losing text.
export function captureSpeech({
  Speech,
  onText = () => {},
  onFinish = () => {},
  onError = () => {},
  silenceMs = 0,
  maxMs = 120000,
}) {
  let r,
    active = true,
    finished = false,
    base = "",
    current = "",
    idle,
    limit,
    restart;
  const clear = () => {
    clearTimeout(idle);
    clearTimeout(limit);
    clearTimeout(restart);
  };
  const text = () => [base, current].filter(Boolean).join(" ").trim();
  function finish() {
    if (finished) return;
    finished = true;
    active = false;
    clear();
    r?.abort();
    onFinish(text());
  }
  function abort() {
    active = false;
    finished = true;
    clear();
    r?.abort();
  }
  function start() {
    if (!active) return;
    r = new Speech();
    r.lang = "es-PE";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      current = Array.from(e.results, (result) => result[0].transcript)
        .join(" ")
        .trim();
      onText(text());
      clearTimeout(idle);
      if (silenceMs) idle = setTimeout(finish, silenceMs);
    };
    r.onspeechstart = () => clearTimeout(idle);
    r.onspeechend = () => {
      if (silenceMs && text()) {
        clearTimeout(idle);
        idle = setTimeout(finish, silenceMs);
      }
    };
    r.onerror = (e) => {
      if (!active || e.error === "aborted") return;
      if (e.error === "no-speech") {
        if (text() && silenceMs) finish();
        return;
      }
      abort();
      onError(e.error);
    };
    r.onend = () => {
      if (!active) return;
      base = text();
      current = "";
      restart = setTimeout(() => {
        try {
          start();
        } catch {
          abort();
          onError("start");
        }
      }, 300);
    };
    r.start();
  }
  try {
    start();
    limit = setTimeout(finish, maxMs);
  } catch {
    abort();
    onError("start");
  }
  return { finish, abort };
}
