import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
const Context = createContext();
export const useApp = () => useContext(Context);
export function Provider({ children }) {
  const [user, setUser] = useState(null),
    [config, setConfig] = useState(null),
    [reports, setReports] = useState([]),
    [notes, setNotes] = useState([]),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [offline, setOffline] = useState(!navigator.onLine),
    [prefs, setPrefs] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("ce-display") || "{}");
      } catch {
        return {};
      }
    });
  const refresh = async () => {
    const data = await api("/reports");
    setReports(data);
  };
  // Only public fields are retained for offline consultation; never cookies or account data.
  useEffect(() => {
    if (config)
      try {
        localStorage.setItem("ce-public-config", JSON.stringify(config));
      } catch {}
  }, [config]);
  useEffect(() => {
    if (reports.length)
      try {
        localStorage.setItem(
          "ce-public-reports",
          JSON.stringify(
            reports.map((r) => ({ ...r, supported: false, following: false })),
          ),
        );
      } catch {}
  }, [reports]);
  useEffect(() => {
    Promise.all([api("/config"), api("/me"), api("/reports")])
      .then(([c, u, r]) => {
        setConfig(c);
        setUser(u);
        setReports(r);
        if (u) setPrefs(u.prefs);
      })
      .catch((e) => {
        setError(e.message);
        try {
          const c = JSON.parse(
            localStorage.getItem("ce-public-config") || "null",
          );
          if (c) {
            setConfig(c);
            setReports(
              JSON.parse(localStorage.getItem("ce-public-reports") || "[]"),
            );
            setOffline(!navigator.onLine);
            setMessage(
              "Vista pública guardada. Conecta para recuperar tu sesión y publicar.",
            );
          }
        } catch {}
      })
      .finally(() => setLoading(false));
    const on = () => setOffline(false),
      off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }
    let alive = true;
    const poll = () => {
      if (!navigator.onLine) return;
      Promise.all([api("/notifications"), api("/reports")])
        .then(([n, r]) => {
          if (alive) {
            setNotes(n);
            setReports(r);
          }
        })
        .catch(() => {});
    };
    poll();
    const t = setInterval(poll, 12000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user?.id]);
  useEffect(() => {
    const root = document.documentElement;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (root.dataset.theme =
        prefs.theme === "auto"
          ? media.matches
            ? "dark"
            : "light"
          : prefs.theme || "light");
    apply();
    media.addEventListener("change", apply);
    root.dataset.contrast = prefs.contrast ? "high" : "normal";
    root.dataset.reduced = prefs.reduced ? "true" : "false";
    root.style.fontSize = (prefs.fontSize || 100) + "%";
    root.style.letterSpacing = (prefs.spacing || 0) * 0.025 + "em";
    root.style.fontFamily =
      prefs.font === "serif"
        ? "Georgia, serif"
        : prefs.font === "sans"
          ? "Verdana, sans-serif"
          : "Inter, Segoe UI, system-ui, sans-serif";
    try {
      localStorage.setItem(
        "ce-display",
        JSON.stringify({
          theme: prefs.theme,
          fontSize: prefs.fontSize,
          contrast: prefs.contrast,
          reduced: prefs.reduced,
          font: prefs.font,
          spacing: prefs.spacing,
        }),
      );
    } catch {}
    return () => media.removeEventListener("change", apply);
  }, [prefs]);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 6500);
      return () => clearTimeout(t);
    }
  }, [message]);
  const act = async (fn, success) => {
    setError("");
    try {
      const result = await fn();
      if (success) setMessage(success);
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };
  const recordUse = async (event) => {
    try {const r=await api("/me/usage",{method:"POST",body:{event}});setPrefs(r.prefs);setUser(u=>({...u,prefs:r.prefs,learning:r.learning}));return r;}catch{return null;}
  };
  const savePrefs = async (p) => {
    setPrefs(p);
    const saved = await act(
      () => api("/preferences", { method: "PUT", body: p }),
      "Preferencias guardadas en tu cuenta.",
    );
    if (saved) {setPrefs(saved);setUser((u) => ({ ...u, prefs: saved }));}
    else setPrefs(user?.prefs || {});
    return saved;
  };
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        config,
        reports,
        refresh,
        notes,
        setNotes,
        loading,
        error,
        setError,
        message,
        setMessage,
        offline,
        prefs,
        setPrefs,
        savePrefs,
        recordUse,
        act,
      }}
    >
      {children}
    </Context.Provider>
  );
}
