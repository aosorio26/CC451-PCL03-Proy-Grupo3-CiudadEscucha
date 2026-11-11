import {Personalization} from "./Mascots";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  ShieldCheck,
  Heart,
  Users,
  Check,
  Download,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { LevelProgress, Friends } from "./Social";
import { useApp } from "./context";
import { api, download, date } from "./api";
import { ReportCard, Filters, filterReports, Badge } from "./Reports";
export function Auth({ register = false }) {
  const { act, setUser, setPrefs, config } = useApp(),
    navigate = useNavigate(),
    [busy, setBusy] = useState(false);
  return (
    <div className="auth-layout">
      <section className="auth-brand">
        <Link to="/" className="brand">
          <img className="brand-image" src="/ciudad-escucha-logo.png" alt="Ciudad Escucha"/>
        </Link>
        <h1>
          Una ciudad mejor
          <br />
          empieza con
          <br />
          <em>tu voz.</em>
        </h1>
        <p>Reporta, conecta y acompaña los cambios de tu barrio.</p>
        <img
          src="/parque-ciudad.png"
          alt="Ilustración de un barrio con árboles y edificios"
        />
        <small>Lima Metropolitana · Comunidad que cuida</small>
      </section>
      <section className="auth-form">
        <p className="eyebrow">QUÉ BUENO TENERTE AQUÍ</p>
        <h1>{register ? "Sumemos tu voz" : "Volvamos al barrio"}</h1>
        <p className="muted">
          {register
            ? "Crea tu cuenta y participa a tu manera."
            : "Inicia sesión para seguir construyendo comunidad."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const body = Object.fromEntries(new FormData(e.currentTarget));
            const u = await act(() =>
              api("/auth/" + (register ? "register" : "login"), {
                method: "POST",
                body,
              }),
            );
            setBusy(false);
            if (u) {
              setUser(u);
              setPrefs(u.prefs);
              navigate(
                ["operador", "administrador"].includes(u.role)
                  ? "/operador"
                  : u.prefs.voiceMode
                    ? "/voz"
                    : u.prefs.onboardingCompleted
                      ? "/"
                      : "/bienvenida",
              );
            }
          }}
        >
          {register && (
            <label>
              Nombre o alias
              <input
                name="name"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={60}
              />
            </label>
          )}
          <label>
            Correo electrónico
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={10}
              maxLength={128}
            />
          </label>
          <small>Usa al menos 10 caracteres.</small>
          <button className="primary wide" disabled={busy}>
            {busy
              ? "Conectando…"
              : register
                ? "Crear mi cuenta"
                : "Entrar a Ciudad Escucha"}
            <ArrowUpRight size={18} />
          </button>
        </form>
        <p>
          {register ? "¿Ya tienes cuenta?" : "¿Primera vez por aquí?"}{" "}
          <Link to={register ? "/login" : "/registro"}>
            {register ? "Inicia sesión" : "Crea una cuenta"}
          </Link>
        </p>

      </section>
    </div>
  );
}
export function Welcome() {
  const { user, savePrefs, prefs } = useApp(),
    navigate = useNavigate();
  return (
    <section className="welcome panel">
      <img src="/rescue-rabbit.png" alt="Rescue Rabbit te da la bienvenida" />
      <p className="eyebrow">UN BARRIO QUE SE ESCUCHA</p>
      <h1>Bienvenido, {user.name}.</h1>
      <p>
        Tu voz cuenta. Puedes reportar lo que ves, apoyar a otros vecinos y
        seguir cada avance.
      </p>
      <div className="actions">
        <button className="primary" onClick={() => navigate("/?tour=1")}>
          Conocer la aplicación →
        </button>
        <button
          className="secondary"
          onClick={async () => {
            await savePrefs({ ...prefs, onboardingCompleted: true });
            navigate("/");
          }}
        >
          Explorar por mi cuenta
        </button>
      </div>
      <small>Puedes reiniciar el recorrido desde Ajustes.</small>
    </section>
  );
}
export function Settings() {
  const { prefs, setPrefs, savePrefs, config, act } = useApp(),
    navigate = useNavigate(),
    [voices, setVoices] = useState([]);
  useEffect(() => {
    const update = () => setVoices(window.speechSynthesis?.getVoices() || []);
    update();
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", update);
  }, []);
  const set = (key, value) => setPrefs({ ...prefs, [key]: value });
  return (
    <>
      <p className="eyebrow">A TU MANERA</p>
      <h1>Accesibilidad y preferencias</h1>
      <Personalization/>
      <p className="muted">
        Los cambios visuales se previsualizan al instante. Guarda para
        mantenerlos en tu cuenta.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          savePrefs(prefs);
        }}
      >
        <div className="settings-grid">
          <section className="panel">
            <h2>Una lectura cómoda</h2>
            <Link className="secondary" to="/voz">
              Abrir modo solo voz
            </Link>
            <label className="check">
              <input
                type="checkbox"
                checked={!!prefs.voiceMode}
                onChange={(e) => set("voiceMode", e.target.checked)}
              />
              Iniciar en modo de voz
            </label>
            <label>
              Apariencia
              <select
                value={prefs.theme}
                onChange={(e) => set("theme", e.target.value)}
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Según mi dispositivo</option>
              </select>
            </label>
            <label>
              Tamaño del texto · {prefs.fontSize}%
              <input
                type="range"
                min="100"
                max="180"
                step="10"
                value={prefs.fontSize}
                onChange={(e) => set("fontSize", Number(e.target.value))}
              />
            </label>
            <label>
              Tipografía
              <select
                value={prefs.font}
                onChange={(e) => set("font", e.target.value)}
              >
                <option value="system">Sistema</option>
                <option value="sans">Verdana</option>
                <option value="serif">Georgia</option>
              </select>
            </label>
            <label>
              Espaciado · {prefs.spacing}
              <input
                type="range"
                min="0"
                max="3"
                value={prefs.spacing}
                onChange={(e) => set("spacing", Number(e.target.value))}
              />
            </label>
            {[
              ["contrast", "Alto contraste"],
              ["reduced", "Reducir movimiento y estímulos"],
              ["mascot", "Mostrar mascota de asistencia"],
            ].map(([k, l]) => (
              <label className="check" key={k}>
                <input
                  type="checkbox"
                  checked={prefs[k]}
                  onChange={(e) => set(k, e.target.checked)}
                />
                {l}
              </label>
            ))}
            <div className="preview-text">
              <strong>Así se verá tu contenido.</strong>
              <p>
                Tu reporte está en revisión. Puedes consultar los detalles
                cuando quieras.
              </p>
            </div>
          </section>
          <section className="panel">
            <h2>Una voz que te acompañe</h2>
            <label>
              Tono del asistente
              <select
                value={prefs.tone}
                onChange={(e) => set("tone", e.target.value)}
              >
                {[
                  "Cercano y empático",
                  "Profesional y claro",
                  "Breve y directo",
                  "Guiado/paciente",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Voz
              <select
                value={prefs.voice}
                onChange={(e) => set("voice", e.target.value)}
              >
                <option value="">Automática (español)</option>
                {voices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Velocidad · {prefs.rate}
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={prefs.rate}
                onChange={(e) => set("rate", Number(e.target.value))}
              />
            </label>
            <label>
              Volumen · {Math.round(prefs.volume * 100)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={prefs.volume}
                onChange={(e) => set("volume", Number(e.target.value))}
              />
            </label>
            <p className="muted">
              Las respuestas siempre están disponibles en texto. No escuchamos
              en segundo plano.
            </p>
            <button
              type="button"
              className="secondary"
              onClick={() => navigate("/?tour=1")}
            >
              Reiniciar recorrido guiado
            </button>
          </section>
          <section className="panel">
            <h2>Tu barrio e intereses</h2>
            <label>
              Distrito preferido
              <select
                value={prefs.district}
                onChange={(e) => set("district", e.target.value)}
              >
                {Object.keys(config.districts).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Vista inicial del mapa
              <select
                value={prefs.view}
                onChange={(e) => set("view", e.target.value)}
              >
                {[
                  "Marcadores",
                  "Burbujas",
                  "Mapa de calor",
                  "Lista accesible",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Temas favoritos</legend>
              {config.categories.map((c) => (
                <label className="check" key={c}>
                  <input
                    type="checkbox"
                    checked={prefs.favorites.includes(c)}
                    onChange={(e) =>
                      set(
                        "favorites",
                        e.target.checked
                          ? [...prefs.favorites, c]
                          : prefs.favorites.filter((v) => v !== c),
                      )
                    }
                  />
                  {c}
                </label>
              ))}
            </fieldset>
          </section>
          <section className="panel">
            <h2>Privacidad y memoria</h2>
            {[
              ["notifications", "Recibir notificaciones internas"],
              [
                "publicProfile",
                "Mostrar alias, biografía y publicaciones en mi perfil público",
              ],
              ["achievements", "Mostrar reconocimientos y puntos"],
              ["history", "Guardar el historial de conversación"],
            ].map(([k, l]) => (
              <label className="check" key={k}>
                <input
                  type="checkbox"
                  checked={prefs[k]}
                  onChange={(e) => set(k, e.target.checked)}
                />
                {l}
              </label>
            ))}
            <p className="muted">
              No inferimos emociones ni discapacidad. El correo nunca aparece en
              tu perfil público. Los reportes publicados permanecen visibles con
              autor anónimo si ocultas el perfil.
            </p>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                act(async () =>
                  download(
                    "ciudad-escucha-mis-datos.json",
                    await api("/export"),
                  ),
                )
              }
            >
              <Download size={17} />
              Exportar mis datos
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                act(
                  () => api("/assistant/history", { method: "DELETE" }),
                  "Historial eliminado.",
                )
              }
            >
              Borrar historial de conversación
            </button>
          </section>
        </div>
        <div className="save-bar">
          <button className="primary">Guardar preferencias</button>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              const p = await act(
                () => api("/preferences", { method: "PUT", body: {} }),
                "Preferencias restablecidas.",
              );
              if (p) setPrefs(p);
            }}
          >
            Restablecer preferencias
          </button>
        </div>
      </form>
    </>
  );
}
export function Profile({ neighbor = false }) {
  const { id } = useParams(),
    { user, act, reports, setUser } = useApp(),
    [profile, setProfile] = useState(null),
    [avatarBusy, setAvatarBusy] = useState(false);
  const target = neighbor ? id : user.id;
  const load = () => api("/users/" + target).then(setProfile);
  useEffect(() => {
    act(load);
  }, [target]);
  if (!profile) return <p>Cargando perfil…</p>;
  const own = target === user.id;
  const follow = profile.relations.find(
      (r) =>
        r.user_id === user.id && r.target_id === target && r.kind === "follow",
    ),
    friend = profile.relations.find(
      (r) =>
        r.kind === "friend" &&
        ((r.user_id === user.id && r.target_id === target) ||
          (r.target_id === user.id && r.user_id === target)),
    );
  async function changeAvatar(file) {
    setAvatarBusy(true);
    await act(async () => {
      if (file && (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5*1024*1024)) throw new Error("Usa JPG, PNG o WebP de hasta 5 MB.");
      const image = file ? await new Promise((resolve,reject) => {const reader = new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("No se pudo leer el archivo."));reader.readAsDataURL(file);}) : null;
      const updated = await api("/me/avatar",{method:"PUT",body:{image}});
      setUser(updated); await load();
    }, file ? "Avatar actualizado." : "Avatar eliminado.");
    setAvatarBusy(false);
  }
  const relation = async (kind, action) =>
    act(async () => {
      await api("/users/" + target + "/relation", {
        method: "PUT",
        body: { kind, action },
      });
      await load();
    }, "Relación actualizada.");
  return (
    <>
      <section className="panel profile-hero">
        <Avatar user={own ? user : profile} large />
        <div>
          <p className="eyebrow">
            {profile.role === "ciudadano"
              ? "UNA VOZ DE LA COMUNIDAD"
              : profile.role}
          </p>
          <h1>{own ? user.name : profile.name}</h1>
          <p>{profile.bio || "Cuidar el barrio empieza por escuchar."}</p>
          {!own && (
            <div className="actions">
              <button
                className="primary"
                onClick={() =>
                  relation("follow", follow ? "remove" : "request")
                }
              >
                {follow ? "Dejar de seguir" : "Seguir vecino"}
              </button>
              {friend?.status === "accepted" ? (
                <button
                  className="secondary"
                  onClick={() => relation("friend", "remove")}
                >
                  Amistad aceptada · Quitar
                </button>
              ) : friend?.target_id === user.id ? (
                <button
                  className="secondary"
                  onClick={() => relation("friend", "accept")}
                >
                  Aceptar amistad
                </button>
              ) : (
                <button
                  className="secondary"
                  onClick={() =>
                    relation("friend", friend ? "remove" : "request")
                  }
                >
                  {friend ? "Cancelar solicitud" : "Solicitar amistad"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      <div className="stats">
        {[
          ["Reportes", profile.stats.reports],
          ["Apoyos dados", profile.stats.supports],
          ["En seguimiento", profile.stats.following],
          ["Resueltos", profile.stats.resolved],
        ].map(([l, n]) => (
          <div key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      {profile.points !== null && (
        <section className="panel">
          <h2>Pequeñas acciones, impacto compartido</h2>
          <LevelProgress points={profile.points} />
          <p>
            {profile.points} puntos de contribución · Sin premios económicos ni
            beneficios municipales.
          </p>
          <div className="actions">
            {profile.stats.reports > 0 && (
              <span className="achievement">
                <Check />
                Primera voz
              </span>
            )}
            {profile.stats.supports > 0 && (
              <span className="achievement">
                <Heart />
                Vecino solidario
              </span>
            )}
            {profile.stats.resolved > 0 && (
              <span className="achievement">
                <ShieldCheck />
                Impacto comunitario
              </span>
            )}
          </div>
        </section>
      )}
      {own && (
        <section className="panel">
          <h2>Tu presentación</h2>
          <label>Subir avatar<input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarBusy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)changeAvatar(file);}} /></label>
          <p>JPG, PNG o WebP, hasta 5 MB. Se recorta al centro y se eliminan metadatos. La foto se muestra en tu perfil público.</p>
          {avatarBusy && <p role="status">Guardando avatar…</p>}
          {user.avatar && <button type="button" className="secondary" disabled={avatarBusy} onClick={()=>changeAvatar(null)}>Quitar avatar</button>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                const u = await api("/me", {
                  method: "PUT",
                  body: Object.fromEntries(new FormData(e.currentTarget)),
                });
                setUser(u);
                await load();
              }, "Perfil actualizado.");
            }}
          >
            <label>
              Alias
              <input
                name="name"
                defaultValue={user.name}
                minLength={2}
                maxLength={60}
                required
              />
            </label>
            <label>
              Biografía breve
              <textarea name="bio" defaultValue={user.bio} maxLength={240} />
            </label>
            <button className="primary">Guardar perfil</button>
          </form>
        </section>
      )}
      {own && <Friends />}
      <h2>Publicaciones</h2>
      <div className="report-grid">
        {(own
          ? reports.filter((r) => r.user_id === user.id)
          : profile.reports
        ).map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
    </>
  );
}
export function Community() {
  const { reports, user, act, prefs } = useApp(),
    [tab, setTab] = useState("Recientes"),
    [users, setUsers] = useState([]),
    [relations, setRelations] = useState([]),
    [q, setQ] = useState("");
  useEffect(() => {
    act(async () => {
      setUsers(await api("/users"));
      setRelations(await api("/relations"));
    });
  }, []);
  const contacts = new Set(
    relations
      .filter(
        (r) =>
          (r.kind === "follow" && r.user_id === user.id) ||
          (r.kind === "friend" && r.status === "accepted"),
      )
      .map((r) => (r.user_id === user.id ? r.target_id : r.user_id)),
  );
  const data = reports.filter(
    (r) =>
      (tab === "Recientes" ||
        (tab === "Cercanas" && r.district === prefs.district) ||
        (tab === "Seguidas" && r.following) ||
        (tab === "Mis contactos" && contacts.has(r.user_id))) &&
      (!q || r.title.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <p className="eyebrow">JUNTOS, EL BARRIO CAMBIA</p>
      <h1>La comunidad se mueve</h1>
      <p className="muted">
        Encuentra otras voces, comparte contexto y acompaña sus reportes.
      </p>
      <div className="community-layout">
        <section>
          <div className="tabs">
            {["Recientes", "Cercanas", "Seguidas", "Mis contactos"].map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <label>
            Buscar publicaciones
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título"
            />
          </label>
          <div className="report-grid">
            {data.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
          {!data.length && (
            <p className="empty">No hay publicaciones en esta vista.</p>
          )}
        </section>
        <aside className="panel">
          <Users className="teal" />
          <Friends />
          <h2>Vecinos para conocer</h2>
          {users
            .filter((u) => u.id !== user.id && u.publicProfile)
            .map((u) => (
              <Link key={u.id} className="neighbor" to={"/vecinos/" + u.id}>
                <Avatar user={u} />
                <span>
                  <strong>{u.name}</strong>
                  <small>
                    {u.stats.reports} reportes · {u.role}
                  </small>
                  {relations.some(
                    (r) =>
                      r.kind === "friend" &&
                      r.status === "pending" &&
                      r.user_id === u.id &&
                      r.target_id === user.id,
                  ) && <small>Solicitud de amistad pendiente</small>}
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
        </aside>
      </div>
    </>
  );
}
export function Notifications() {
  const { notes, setNotes, act } = useApp();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SIGAMOS EN CONTACTO</p>
          <h1>Tus notificaciones</h1>
        </div>
        <button
          className="secondary"
          onClick={() =>
            act(async () => {
              await api("/notifications/read", { method: "PUT", body: {} });
              setNotes(notes.map((n) => ({ ...n, read: 1 })));
            }, "Notificaciones marcadas como leídas.")
          }
        >
          Marcar todas como leídas
        </button>
      </div>
      <section className="panel">
        {notes.length ? (
          notes.map((n) => (
            <article
              className={"notification " + (!n.read ? "unread" : "")}
              key={n.id}
            >
              <span className="notification-dot" />
              <div>
                <p>{n.body}</p>
                <small>{date(n.created)}</small>
                {n.report_id ? (
                  <Link to={"/incidencias/" + n.report_id}>
                    Ver incidencia →
                  </Link>
                ) : (
                  <Link to="/comunidad">Ver comunidad →</Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="empty">
            Cuando alguien colabore contigo, lo verás aquí.
          </p>
        )}
      </section>
    </>
  );
}
export function Operator() {
  const { user, reports, config, act, refresh } = useApp(),
    [summary, setSummary] = useState(null),
    [users, setUsers] = useState([]),
    [filters, setFilters] = useState({}),
    [selected, setSelected] = useState(null);
  const load = () => api("/operator/summary").then(setSummary);
  useEffect(() => {
    act(load);
    if (user.role === "administrador")
      api("/users")
        .then(setUsers)
        .catch(() => {});
  }, []);
  if (!summary) return <p>Cargando panel…</p>;
  return (
    <>
      <p className="eyebrow">GESTIÓN · {user.role.toUpperCase()}</p>
      <h1>Tu centro de operaciones</h1>
      <p>Prioriza, revisa y resuelve las incidencias de tu comunidad.</p>
      <div className="actions">
        <button
          className="secondary"
          onClick={() => setFilters({ status: "Reportado" })}
        >
          Pendientes
        </button>
        <button
          className="secondary"
          onClick={() => setFilters({ urgency: "Alta" })}
        >
          Urgencia alta
        </button>
        <button
          className="secondary"
          onClick={() => setFilters({ status: "En atención" })}
        >
          En atención
        </button>
        <button className="text-button" onClick={() => setFilters({})}>
          Ver todas
        </button>
      </div>
      <p className="notice">
        Cada actualización queda registrada y se comparte con quienes siguen la incidencia.
      </p>
      <div className="stats">
        {config.statuses.map((s) => (
          <div key={s}>
            <strong>{reports.filter((r) => r.status === s).length}</strong>
            <span>{s}</span>
          </div>
        ))}
      </div>
      <Filters filters={filters} setFilters={setFilters} />
      <div className="panel table-wrap">
        <table>
          <caption>Incidencias por atender</caption>
          <thead>
            <tr>
              <th>Incidencia</th>
              <th>Distrito</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filterReports(reports, filters).map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={"/incidencias/" + r.id}>{r.title}</Link>
                </td>
                <td>{r.district}</td>
                <td>
                  <Badge status={r.status} />
                </td>
                <td>
                  <button className="secondary" onClick={() => { setSelected(r); setTimeout(() => document.getElementById("operator-editor")?.scrollIntoView({behavior:"smooth",block:"start"}), 0); }}>
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <section id="operator-editor" className="panel" aria-label="Actualizar incidencia">
          <h2>{selected.title}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = Object.fromEntries(new FormData(e.currentTarget));
              if (
                !window.confirm(
                  `¿Confirmar el estado «${form.status}»? Quedará registrado y se notificará a quienes siguen la incidencia.`,
                )
              )
                return;
              act(async () => {
                await api("/operator/reports/" + selected.id, {
                  method: "PUT",
                  body: {
                    ...form,
                    assigned: form.assigned || null,
                    confirmed: true,
                  },
                });
                await refresh();
                await load();
                setSelected(null);
              }, "Estado actualizado y notificaciones enviadas.");
            }}
          >
            <label>
              Estado
              <select name="status" defaultValue={selected.status}>
                {config.statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Responsable
              <select name="assigned" defaultValue={selected.assigned || ""}>
                <option value="">Sin asignar</option>
                {summary.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nota del cambio
              <textarea required minLength={5} maxLength={400} name="note" />
            </label>
            <div className="actions">
              <button className="primary">Revisar y confirmar cambio</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setSelected(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="settings-grid">
        <section className="panel">
          <h2>Panorama por distrito</h2>
          {Object.entries(
            summary.districts.reduce(
              (a, r) => ({
                ...a,
                [r.district]: (a[r.district] || 0) + r.count,
              }),
              {},
            ),
          ).map(([d, n]) => (
            <p key={d} className="summary-row">
              <span>{d}</span>
              <strong>{n} reportes</strong>
            </p>
          ))}
        </section>
        <section className="panel">
          <h2>Moderación básica</h2>
          {summary.flags.length ? (
            summary.flags.map((f) => (
              <div key={f.id}>
                <p>{f.body}</p>
                <small>{f.count} denuncias</small>
                <button
                  className="secondary"
                  onClick={() =>
                    window.confirm("¿Ocultar este comentario denunciado?") &&
                    act(async () => {
                      await api("/operator/comments/" + f.id + "/hide", {
                        method: "PUT",
                        body: {},
                      });
                      await load();
                    }, "Comentario ocultado.")
                  }
                >
                  Ocultar comentario
                </button>
              </div>
            ))
          ) : (
            <p className="muted">No hay comentarios denunciados pendientes.</p>
          )}
        </section>
      </div>
      {user.role === "administrador" && (
        <section className="panel">
          <h2>Administración de roles</h2>
          <p>
            Solo el administrador puede cambiar permisos. Tu propio rol queda
            protegido.
          </p>
          {users
            .filter((u) => u.id !== user.id)
            .map((u) => (
              <div className="summary-row" key={u.id}>
                <strong>{u.name}</strong>
                <select
                  aria-label={"Rol de " + u.name}
                  value={u.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    if (
                      window.confirm(`¿Cambiar el rol de ${u.name} a ${role}?`)
                    )
                      act(async () => {
                        await api("/admin/users/" + u.id + "/role", {
                          method: "PUT",
                          body: { role },
                        });
                        setUsers(await api("/users"));
                        await load();
                      }, "Rol actualizado.");
                  }}
                >
                  {["ciudadano", "operador", "administrador"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            ))}
        </section>
      )}
    </>
  );
}
