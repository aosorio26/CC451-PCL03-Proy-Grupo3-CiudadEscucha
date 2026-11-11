import React, { useEffect, useState, useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  MapPin,
  Heart,
  MessageCircle,
  ArrowLeft,
  Share2,
  Bookmark,
  LocateFixed,
  Check,
  ArrowRight,
  Camera,
  SlidersHorizontal,
} from "lucide-react";
import { api, date } from "./api";
import { useApp } from "./context";
import { Dictate, Speak } from "./Voice";
import CityMap from "./Map";
import { CategoryIcon, Sheet } from "./Mobile";
export function Badge({ status }) {
  return (
    <span
      className={
        "badge " +
        (status === "Resuelto"
          ? "resolved"
          : status === "En atención"
            ? "attention"
            : "")
      }
    >
      {status}
    </span>
  );
}
export function ReportCard({ report: r }) {
  return (
    <article className="report-card">
      <div className="report-visual">
        {r.photo ? (
          <img
            src={r.photo}
            alt={r.photo_alt || "Foto de la incidencia"}
            loading="lazy"
          />
        ) : (
          <span className="report-category-art">
            <CategoryIcon category={r.category} size={32} />
          </span>
        )}
        <span className="report-visual-category">{r.category}</span>
      </div>
      <div className="card-top">
        <span className="category">{r.category}</span>
        <Badge status={r.status} />
      </div>
      <Link className="report-title" to={"/incidencias/" + r.id}>
        {r.title}
        <ArrowUpRight size={19} />
      </Link>
      <p className="muted">
        <MapPin size={14} />
        {r.district}
      </p>
      <p className="excerpt">{r.description}</p>
      <div className="card-foot">
        <span>
          <Heart size={15} />
          {r.supports} apoyos
        </span>
        <span>
          <MessageCircle size={15} />
          {r.comments}
        </span>
        {!!r.demo && <small>Ejemplo</small>}
      </div>
    </article>
  );
}
export function Filters({ filters, setFilters }) {
  const { config } = useApp();
  return (
    <div className="filters">
      <label className="search-field">
        Buscar
        <input
          placeholder="¿Qué pasa en tu barrio?"
          value={filters.q || ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
      </label>
      {[
        ["district", "Distrito", Object.keys(config.districts)],
        ["category", "Categoría", config.categories],
        ["status", "Estado", config.statuses],
        ["urgency", "Urgencia", ["Baja", "Media", "Alta"]],
      ].map(([key, label, values]) => (
        <label key={key}>
          {label}
          <select
            value={filters[key] || ""}
            onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
          >
            <option value="">Todos</option>
            {values.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      ))}
      <label>
        Desde
        <input
          type="date"
          value={filters.from || ""}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
      </label>
    </div>
  );
}
export function filterReports(reports, f) {
  return reports.filter(
    (r) =>
      (!f.q ||
        (r.title + " " + r.description)
          .toLowerCase()
          .includes(f.q.toLowerCase())) &&
      ["district", "category", "status", "urgency"].every(
        (k) => !f[k] || r[k] === f[k],
      ) &&
      (!f.from || r.created.slice(0, 10) >= f.from),
  );
}
export function Explore({ mine = false }) {
  const [search] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const { reports, user, prefs } = useApp(),
    [filters, setFilters] = useState(() => ({
      category: search.get("category") || "",
      status: search.get("status") || "",
    })),
    [mode, setMode] = useState(
      mine ? "Lista accesible" : prefs.view || "Marcadores",
    ),
    [following, setFollowing] = useState(false);
  const data = filterReports(
    reports.filter(
      (r) => !mine || (following ? r.following : r.user_id === user?.id),
    ),
    filters,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {mine ? "TU PARTICIPACIÓN" : "LIMA, EN COMUNIDAD"}
          </p>
          <h1>{mine ? "Mis reportes" : "Un mapa, muchas voces"}</h1>
          <p className="muted">
            Cada punto es una oportunidad para mejorar nuestro entorno.
          </p>
        </div>
        <Link className="primary" to="/reportar">
          Crear reporte <ArrowUpRight size={18} />
        </Link>
      </div>
      {mine && (
        <div className="tabs">
          <button aria-pressed={!following} onClick={() => setFollowing(false)}>
            Creados por mí
          </button>
          <button aria-pressed={following} onClick={() => setFollowing(true)}>
            En seguimiento
          </button>
        </div>
      )}
      <div className="filter-summary">
        <button className="secondary" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal size={18} />
          Filtros
          {Object.values(filters).filter(Boolean).length
            ? ` · ${Object.values(filters).filter(Boolean).length}`
            : ""}
        </button>
        <span>
          {filters.district || "Todos los distritos"}
          {filters.category ? " · " + filters.category : ""}
        </span>
        {Object.values(filters).some(Boolean) && (
          <button className="text-button" onClick={() => setFilters({})}>
            Limpiar
          </button>
        )}
      </div>
      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Encuentra lo que te importa"
      >
        <Filters filters={filters} setFilters={setFilters} />
        <button className="primary wide" onClick={() => setFilterOpen(false)}>
          Ver {data.length} incidencias
        </button>
      </Sheet>
      <div className="map-toolbar">
        <p role="status">
          {data.length} incidencias en{" "}
          {filters.district || "Lima Metropolitana"}
        </p>
        {!mine && (
          <div className="tabs">
            {["Marcadores", "Burbujas", "Mapa de calor", "Lista accesible"].map(
              (m) => (
                <button
                  key={m}
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ),
            )}
          </div>
        )}
      </div>
      {mode !== "Lista accesible" && (
        <>
          <CityMap reports={data} mode={mode} />
          <p className="map-caption">
            {mode === "Mapa de calor"
              ? "Densidad de reportes: menor ░░▒▒▓▓ mayor. No representa riesgo oficial."
              : mode === "Burbujas"
                ? "El tamaño representa la cantidad de apoyos vecinales."
                : "Los grupos muestran la cantidad de reportes cercanos."}{" "}
            Cartografía requiere conexión.
          </p>
        </>
      )}
      <div className="report-grid">
        {data.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
      {!data.length && (
        <div className="empty">
          No hay incidencias para estos filtros. Prueba otro distrito o crea un
          reporte.
        </div>
      )}
    </>
  );
}
export function Detail() {
  const { id } = useParams(),
    { user, act, refresh, setMessage } = useApp(),
    [r, setR] = useState(null),
    [text, setText] = useState(""),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false);
  const load = () => api("/reports/" + id).then(setR);
  useEffect(() => {
    act(load);
    const t = setInterval(() => load().catch(() => {}), 12000);
    return () => clearInterval(t);
  }, [id]);
  async function action(path, method, body, msg) {
    setBusy(true);
    const result = await act(async () => {
      await api(path, { method, body });
      await load();
      await refresh();
      return true;
    }, msg);
    setBusy(false);
    return result;
  }
  if (!r) return <p role="status">Cargando incidencia…</p>;
  return (
    <>
      <Link className="back" to="/mapa">
        <ArrowLeft size={17} /> Volver a incidencias
      </Link>
      <div className="detail-layout">
        <article className="panel">
          <div className="card-top">
            <span className="category">{r.category}</span>
            <Badge status={r.status} />
          </div>
          <h1>{r.title}</h1>
          <p className="muted">
            <MapPin size={17} />
            {r.district} · {r.address}
          </p>
          {!!r.demo && <p className="notice">Reporte de ejemplo.</p>}
          <p>{r.description}</p>
          {r.photo && (
            <img
              className="report-photo"
              src={r.photo}
              alt={r.photo_alt || "Fotografía de la incidencia"}
            />
          )}
          <p className="muted">
            Por <Link to={"/vecinos/" + r.user_id}>{r.author.name}</Link> ·{" "}
            {date(r.created)}
          </p>
          <div className="actions">
            <button
              disabled={busy || !user || user.id === r.user_id}
              className={r.supported ? "primary" : "secondary"}
              onClick={() =>
                action(
                  "/reports/" + id + "/support",
                  "PUT",
                  { active: !r.supported },
                  r.supported
                    ? "Apoyo retirado."
                    : "Tu apoyo quedó registrado.",
                )
              }
            >
              <Heart size={18} />
              {r.supported ? "Retirar apoyo" : "Apoyar"} · {r.supports}
            </button>
            <button
              disabled={busy || !user}
              className="secondary"
              onClick={() =>
                action(
                  "/reports/" + id + "/follow",
                  "PUT",
                  { active: !r.following },
                  "Seguimiento actualizado.",
                )
              }
            >
              <Bookmark size={18} />
              {r.following ? "Dejar de seguir" : "Seguir"}
            </button>
            <button
              className="secondary"
              onClick={() =>
                act(async () => {
                  const url = location.href;
                  if (navigator.share)
                    await navigator.share({ title: r.title, url });
                  else await navigator.clipboard.writeText(url);
                  setMessage("Enlace compartido o copiado.");
                })
              }
            >
              <Share2 size={18} />
              Compartir
            </button>
          </div>
          {!user && (
            <p>
              <Link to="/login">Inicia sesión para apoyar y comentar.</Link>
            </p>
          )}
          <hr />
          <h2>
            La conversación del barrio{" "}
            <span className="muted">({r.discussion.length})</span>
          </h2>
          {r.discussion.map((c) => (
            <div key={c.id} className="comment">
              <div className="avatar">{c.name[0]}</div>
              <div>
                <strong>{c.name}</strong>
                <small>{date(c.created)}</small>
                <p>{c.body}</p>
                {user && (
                  <div className="actions">
                    {c.user_id === user.id ? (
                      <>
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditing(c.id);
                            setText(c.body);
                            document.getElementById("comment").focus();
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            window.confirm("¿Eliminar tu comentario?") &&
                            action(
                              "/comments/" + c.id,
                              "DELETE",
                              undefined,
                              "Comentario eliminado.",
                            )
                          }
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-button"
                        onClick={() =>
                          action(
                            "/comments/" + c.id + "/flag",
                            "POST",
                            {
                              reason:
                                "Contenido inapropiado reportado por un vecino",
                            },
                            "Denuncia enviada al equipo de revisión.",
                          )
                        }
                      >
                        Denunciar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!r.discussion.length && (
            <p className="muted">
              Todavía no hay comentarios. Comparte información útil y evita
              datos personales.
            </p>
          )}
          {user && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const saved = await action(
                  editing
                    ? "/comments/" + editing
                    : "/reports/" + id + "/comments",
                  editing ? "PUT" : "POST",
                  { body: text },
                  "Comentario guardado.",
                );
                if (saved) {
                  setText("");
                  setEditing(null);
                }
              }}
            >
              <label htmlFor="comment">
                {editing ? "Editar comentario" : "Aporta al reporte"}
              </label>
              <textarea
                id="comment"
                required
                minLength={2}
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="¿Tienes información que pueda ayudar?"
              />
              <button className="primary" disabled={busy}>
                Guardar comentario
              </button>
              {editing && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditing(null);
                    setText("");
                  }}
                >
                  Cancelar edición
                </button>
              )}
            </form>
          )}
        </article>
        <aside>
          <section className="panel">
            <h2>El camino de tu reporte</h2>
            <p className="muted">
              Historial de actualizaciones de esta incidencia.
            </p>
            <ol className="timeline">
              {r.history.map((h) => (
                <li key={h.id}>
                  <strong>{h.status}</strong>
                  <small>{date(h.created)}</small>
                  <p>{h.note}</p>
                </li>
              ))}
            </ol>
            <Speak
              text={`${r.title}. Estado registrado: ${r.status}. ${r.history.at(-1)?.note || ""}`}
            />
          </section>
          <section className="panel">
            <h3>Ubicación aproximada</h3>
            <CityMap reports={[r]} point={[r.lat, r.lng]} height={230} />
            <p className="muted">
              Urgencia declarada por el vecino: {r.urgency}.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
export function ReportForm({
  assistant = false,
  initial,
  onPublished,
  compact = false,
}) {
  const { user, config, act, offline, setMessage } = useApp(),
    navigate = useNavigate();
  const cameraInput = useRef(null),
    locationVersion = useRef(0);
  const [locating, setLocating] = useState(false),
    [locationHint, setLocationHint] = useState("");
  useEffect(
    () => () => {
      locationVersion.current++;
    },
    [],
  );
  const key = "ce-draft-" + user.id;
  const fresh = {
    title: "",
    description: "",
    category: config.categories[0],
    district: "Los Olivos",
    address: "",
    lat: config.districts["Los Olivos"][0],
    lng: config.districts["Los Olivos"][1],
    urgency: "Media",
    photo: null,
    photo_alt: "",
    request_key: crypto.randomUUID(),
  };
  const [draft, setDraft] = useState(() => {
      if (initial) return { ...fresh, ...initial };
      try {
        return { ...fresh, ...JSON.parse(localStorage.getItem(key) || "{}") };
      } catch {
        return fresh;
      }
    }),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [similar, setSimilar] = useState([]),
    [confirmed, setConfirmed] = useState(false),
    [prepared, setPrepared] = useState(null),
    [photoPreview, setPhotoPreview] = useState("");
  useEffect(() => {
    const { photo, ...safe } = draft;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ ...safe, photo: photo || null }),
      );
    } catch {
      setMessage(
        "No hay espacio local para guardar el borrador. Mantén esta pantalla abierta.",
      );
    }
  }, [draft]);
  const patch = (p, fromLookup = false) => {
    if (!fromLookup) {
      locationVersion.current++;
      setLocating(false);
    }
    setDraft((d) => ({ ...d, ...p }));
    setPrepared(null);
    setConfirmed(false);
  };
  async function choosePoint(lat, lng) {
    patch({ lat, lng, address: "", district: "" });
    const version = locationVersion.current;
    setLocating(true);
    setLocationHint("Buscando dirección y distrito…");
    try {
      const r = await api(`/geocode/reverse?lat=${lat}&lng=${lng}`);
      if (version !== locationVersion.current) return;
      patch({ address: r.address || "", district: r.district || "" }, true);
      setLocationHint(
        r.address && r.district
          ? "Ubicación completada con OpenStreetMap. Revisa y ajusta la referencia si hace falta."
          : "No encontramos todos los datos. Completa la dirección o el distrito manualmente.",
      );
    } catch {
      if (version === locationVersion.current)
        setLocationHint(
          "No pudimos obtener la dirección. Escribe la referencia y elige el distrito.",
        );
    } finally {
      if (version === locationVersion.current) setLocating(false);
    }
  }
  async function next(e) {
    e.preventDefault();
    if (step === 2 && !offline) {
      const result = await act(() =>
        api("/reports/duplicates", { method: "POST", body: draft }),
      );
      if (!result) return;
      setSimilar(result);
    }
    setStep((s) => s + 1);
  }
  async function publish() {
    if (!confirmed) return;
    setBusy(true);
    const result = await act(async () => {
      if (assistant) {
        const p =
          prepared ||
          (await api("/assistant/drafts", { method: "POST", body: draft }));
        setPrepared(p);
        return api("/assistant/drafts/" + p.id + "/confirm", {
          method: "POST",
          body: { confirmed: true },
        });
      }
      return api("/reports", {
        method: "POST",
        body: { ...draft, confirmed: true },
      });
    }, "Tu reporte fue publicado y guardado.");
    setBusy(false);
    if (result) {
      localStorage.removeItem(key);
      onPublished?.(result);
      navigate("/incidencias/" + result.id);
    }
  }
  async function photo(file) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      await act(() => {
        throw new Error("Usa una foto JPG, PNG o WebP de hasta 5 MB.");
      });
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      setPhotoPreview(reader.result);
      const data = await act(() =>
        api("/uploads", { method: "POST", body: { image: reader.result } }),
      );
      if (data) patch({ photo: data.url });
      setBusy(false);
    };
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(file);
  }
  return (
    <div className="form-wrap">
      <p className="eyebrow">
        {assistant ? "BORRADOR CONVERSACIONAL" : "TU VOZ MEJORA TU CIUDAD"}
      </p>
      <h1>Hagamos visible el problema</h1>
      {!compact && (
        <Link className="secondary" to="/rapido">
          Crear rápido con IA · editar todos los campos
        </Link>
      )}
      <p className="muted">
        Unos minutos de tu tiempo pueden hacer la diferencia.
      </p>
      {!compact && (
        <ol className="steps">
          {["Cuéntanos", "Ubicación", "Detalles", "Revisión"].map((s, i) => (
            <li
              key={s}
              aria-current={step === i ? "step" : undefined}
              className={step >= i ? "active" : ""}
            >
              <span>{i < step ? <Check size={16} /> : i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      )}
      <div className="panel">
        <form
          onSubmit={
            compact
              ? (e) => {
                  e.preventDefault();
                  publish();
                }
              : next
          }
        >
          {(compact || step === 0) && (
            <>
              <h2>¿Qué está pasando?</h2>
              <label>
                Título breve
                <input
                  required
                  minLength={8}
                  maxLength={120}
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Por ejemplo: semáforo apagado en el cruce"
                />
              </label>
              <label>
                Tipo de problema
                <select
                  value={draft.category}
                  onChange={(e) => patch({ category: e.target.value })}
                >
                  {config.categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Descripción
                <textarea
                  required
                  minLength={15}
                  maxLength={2000}
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Describe lo que observaste, sin incluir datos personales."
                />
              </label>
              <Dictate onText={(description) => patch({ description })} />
              <p className="muted">
                Puedes dictar, corregir y continuar por teclado.
              </p>
            </>
          )}
          {(compact || step === 1) && (
            <>
              <h2>¿Dónde ocurrió?</h2>
              <label>
                Distrito
                <select
                  required
                  value={draft.district}
                  onChange={(e) =>
                    patch({
                      district: e.target.value,
                      lat: config.districts[e.target.value][0],
                      lng: config.districts[e.target.value][1],
                    })
                  }
                >
                  <option value="" disabled>
                    Elige el distrito
                  </option>
                  {Object.keys(config.districts).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                Dirección o referencia pública
                <input
                  required
                  minLength={5}
                  maxLength={250}
                  value={draft.address}
                  onChange={(e) => patch({ address: e.target.value })}
                  placeholder="Cruce de avenidas o referencia cercana"
                />
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  navigator.geolocation
                    ? navigator.geolocation.getCurrentPosition(
                        (p) =>
                          choosePoint(p.coords.latitude, p.coords.longitude),
                        () =>
                          setMessage(
                            "No pudimos usar tu ubicación. Elige distrito y referencia o pulsa el mapa.",
                          ),
                        { timeout: 10000 },
                      )
                    : setMessage("GPS no disponible. Usa la referencia manual.")
                }
              >
                <LocateFixed size={17} />
                Usar mi ubicación
              </button>
              <p className="muted">
                Sin GPS: usa distrito y referencia. El punto inicial es
                aproximado; puedes ajustarlo en el mapa o por coordenadas.
              </p>
              <p role="status">{locationHint}</p>
              <CityMap
                point={[draft.lat, draft.lng]}
                onPick={(p) => choosePoint(p[0], p[1])}
                height={290}
              />
              <div className="columns">
                <label>
                  Latitud
                  <input
                    type="number"
                    step="any"
                    min="-12.6"
                    max="-11.5"
                    required
                    value={draft.lat}
                    onChange={(e) => patch({ lat: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Longitud
                  <input
                    type="number"
                    step="any"
                    min="-77.3"
                    max="-76.5"
                    required
                    value={draft.lng}
                    onChange={(e) => patch({ lng: Number(e.target.value) })}
                  />
                </label>
              </div>
            </>
          )}
          {(compact || step === 2) && (
            <>
              <h2>Un poco más de contexto</h2>
              <label>
                Urgencia que observas
                <select
                  value={draft.urgency}
                  onChange={(e) => patch({ urgency: e.target.value })}
                >
                  {["Baja", "Media", "Alta"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <div className="camera-capture">
                <input
                  ref={cameraInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  aria-label="Tomar fotografía con la cámara"
                  hidden
                  onChange={(e) => photo(e.target.files[0])}
                />
                <button
                  type="button"
                  className="secondary"
                  disabled={offline || busy}
                  onClick={() => cameraInput.current?.click()}
                >
                  <Camera size={20} />
                  Tomar una foto
                </button>
                <p>O elige una imagen de tu galería abajo.</p>
              </div>
              <label>
                Fotografía opcional · JPG, PNG o WebP, hasta 5 MB
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => photo(e.target.files[0])}
                  disabled={offline || busy}
                />
              </label>
              {(photoPreview || draft.photo) && (
                <img
                  className="photo-preview"
                  src={photoPreview || draft.photo}
                  alt="Vista previa de la foto seleccionada"
                />
              )}
              {draft.photo && (
                <>
                  <label>
                    Descripción de la foto
                    <input
                      maxLength={200}
                      value={draft.photo_alt}
                      onChange={(e) => patch({ photo_alt: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      patch({ photo: null });
                      setPhotoPreview("");
                    }}
                  >
                    Retirar foto
                  </button>
                </>
              )}
              <p className="notice">
                Evita rostros, placas y documentos. La imagen será visible en la
                incidencia. La app elimina los metadatos de la foto.
              </p>
            </>
          )}
          {(compact || step === 3) && (
            <>
              <h2>Todo listo para revisar</h2>
              <Badge status="Todavía no publicado" />
              <h3>{draft.title}</h3>
              <p>{draft.description}</p>
              <dl>
                <dt>Categoría</dt>
                <dd>{draft.category}</dd>
                <dt>Ubicación</dt>
                <dd>
                  {draft.district} · {draft.address}
                </dd>
                <dt>Urgencia</dt>
                <dd>{draft.urgency}</dd>
              </dl>
              {similar.length > 0 && (
                <div className="notice">
                  <strong>
                    Encontramos reportes cercanos de la misma categoría.
                  </strong>
                  <p>
                    Puedes apoyar uno existente o continuar con este nuevo
                    reporte.
                  </p>
                  {similar.map((s) => (
                    <p key={s.id}>
                      <Link to={"/incidencias/" + s.id}>{s.title} →</Link>
                    </p>
                  ))}
                </div>
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                Revisé la información y confirmo que quiero publicar este
                reporte.
              </label>
              <button
                type="button"
                className="primary"
                disabled={!confirmed || busy || offline || locating}
                onClick={
                  compact
                    ? (e) => e.currentTarget.form.requestSubmit()
                    : publish
                }
              >
                {busy ? "Guardando…" : "Confirmar y publicar"}
                <ArrowUpRight size={18} />
              </button>
            </>
          )}
          <div className="form-bottom">
            {!compact && step > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft size={17} />
                Atrás
              </button>
            )}
            <small>
              {offline
                ? "Sin conexión. Borrador guardado en este dispositivo; no publicado."
                : "Borrador guardado en este dispositivo."}
            </small>
            {!compact && step < 3 && (
              <button className="primary" disabled={busy}>
                Continuar
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
