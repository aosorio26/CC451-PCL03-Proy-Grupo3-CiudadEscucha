import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ChevronRight,
  Plus,
  Mic,
  Map,
  Heart,
  Lightbulb,
  TrafficCone,
  Trash2,
  Droplets,
  Accessibility,
  Trees,
  ArrowUpRight,
  Download,
  Camera,
  Share2,
  Wifi,
  WifiOff,
  Smartphone,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "./context";
import { ReportCard } from "./Reports";

// Plantillas propias: encabezado, acción táctil y hoja modal reutilizables.
export function ScreenHeading({ eyebrow, title, children }) {
  return (
    <div className="screen-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
export function Sheet({ open, onClose, title, children }) {
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      className="app-sheet"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <div className="sheet-handle" />
      <div className="section-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function CategoryIcon({ category, size = 22 }) {
  const Icon = category?.includes("Alumbrado")
    ? Lightbulb
    : category?.includes("Basura")
      ? Trash2
      : category?.includes("agua") || category?.includes("Desagüe")
        ? Droplets
        : category?.includes("rampas") || category?.includes("accesibilidad")
          ? Accessibility
          : category?.includes("Árbol") || category?.includes("Espacios")
            ? Trees
            : TrafficCone;
  return <Icon size={size} />;
}
function ActionTile({ to, icon: Icon, title, subtitle, tone }) {
  return (
    <Link className={"action-tile " + (tone || "")} to={to}>
      <span className="action-tile-icon">
        <Icon size={23} />
      </span>
      <strong>{title}</strong>
      <small>{subtitle}</small>
      <ArrowUpRight size={17} className="tile-arrow" />
    </Link>
  );
}
export function MobileHome() {
  const { user, reports, prefs, refresh, act, offline } = useApp();
  const [tab, setTab] = useState("Cerca de ti"),
    [busy, setBusy] = useState(false);
  const district = prefs.district || "Los Olivos";
  let selected =
    tab === "Siguiendo"
      ? reports.filter((r) => r.following)
      : tab === "Recientes"
        ? reports
        : reports.filter((r) => r.district === district);
  const categories = [
    ["Alumbrado público", "Alumbrado", Lightbulb],
    ["Baches y pistas", "Vías", TrafficCone],
    ["Basura acumulada", "Limpieza", Trash2],
    ["Fugas de agua", "Agua", Droplets],
    ["Barreras de accesibilidad", "Accesibilidad", Accessibility],
  ];
  return (
    <div className="mobile-home">
      <ScreenHeading
        eyebrow="TU BARRIO, UN POCO MEJOR CADA DÍA"
        title={
          <>
            {user ? `Hola, ${user.name.split(" ")[0]}.` : "Hola, vecino."}
            <br />
            <span>Te escuchamos.</span>
          </>
        }
      >
        <Link className="district-chip" to={user ? "/ajustes" : "/mapa"}>
          <MapPin size={15} />
          {district}
          <ChevronRight size={14} />
        </Link>
      </ScreenHeading>
      <section className="app-hero">
        <div>
          <span className="hero-label">
            <span /> CADA VOZ CUENTA
          </span>
          <h2>
            Un mejor barrio
            <br />
            <em>empieza contigo.</em>
          </h2>
          <p>
            Hagamos visible lo que
            <br />
            necesita nuestro barrio.
          </p>
          <Link className="primary" to="/reportar">
            <Plus size={19} />
            Crear reporte
          </Link>
        </div>
        <div className="rabbit-scene">
          <div className="scene-ring" />
          <img
            src="/parque-ciudad.png"
            alt="Un parque con una banca, árboles y alumbrado"
          />
          <span className="rabbit-caption">
            <Heart size={13} /> Aquí para ayudarte
          </span>
        </div>
      </section>
      <div className="actions" style={{ marginBottom: 20 }}>
        <Link className="secondary" to="/voz">
          Modo solo voz
        </Link>
        <Link className="secondary" to="/rapido">
          Reporte rápido con IA
        </Link>
      </div>
      <div className="home-actions">
        <ActionTile
          to="/asistente"
          icon={Mic}
          title="Cuéntamelo"
          subtitle="Con voz o texto"
          tone="peach"
        />
        <ActionTile
          to="/mapa"
          icon={Map}
          title="Explora tu zona"
          subtitle="Encuentra y apoya"
          tone="mint"
        />
      </div>
      <div className="impact-strip">
        <span className="impact-icon">
          <ShieldCheck size={23} />
        </span>
        <div>
          <strong>
            {reports.filter((r) => r.status === "Resuelto").length} reportes
            resueltos
          </strong>
          <small>Avances compartidos por tu comunidad</small>
        </div>
        <Link to="/mapa?status=Resuelto" aria-label="Ver reportes resueltos">
          <ChevronRight />
        </Link>
      </div>
      <section className="category-section">
        <div className="section-heading">
          <h2>¿Qué necesita tu barrio?</h2>
          <Link to="/mapa">
            Ver todo <ChevronRight size={14} />
          </Link>
        </div>
        <div className="category-rail">
          {categories.map(([value, label, Icon]) => (
            <Link
              key={value}
              to={"/mapa?category=" + encodeURIComponent(value)}
            >
              <span>
                <Icon size={24} />
              </span>
              <strong>{label}</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="nearby-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">VOCES DE LA COMUNIDAD</p>
            <h2>Lo que está pasando</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Actualizar reportes"
            disabled={busy || offline}
            onClick={async () => {
              setBusy(true);
              await act(refresh, "Reportes actualizados.");
              setBusy(false);
            }}
          >
            <RefreshCw size={19} className={busy ? "spinning" : ""} />
          </button>
        </div>
        <div className="tabs home-tabs">
          {["Cerca de ti", "Recientes", "Siguiendo"].map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="report-grid">
          {selected.slice(0, 4).map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
        {!selected.length && (
          <div className="empty">
            {tab === "Siguiendo"
              ? "Aquí aparecerán las incidencias que decidas seguir."
              : "Aún no hay reportes en esta vista. Tu voz puede ser la primera."}
          </div>
        )}
        <Link className="secondary wide more-reports" to="/mapa">
          Explorar todas las incidencias
          <ArrowUpRight size={17} />
        </Link>
      </section>
      <Link className="community-banner" to="/comunidad">
        <span className="community-avatars">
          <i>L</i>
          <i>J</i>
          <i>+</i>
        </span>
        <span>
          <strong>Un barrio se cuida en comunidad</strong>
          <small>Conecta con otras voces</small>
        </span>
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}
export function DeviceCenter({ install, onInstalled }) {
  const { offline, user, act, setMessage } = useApp();
  const [installed, setInstalled] = useState(
      () =>
        matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true,
    ),
    [help, setHelp] = useState(false),
    [storage, setStorage] = useState(null);
  useEffect(() => {
    const done = () => setInstalled(true);
    window.addEventListener("appinstalled", done);
    navigator.storage
      ?.estimate?.()
      .then(setStorage)
      .catch(() => {});
    return () => window.removeEventListener("appinstalled", done);
  }, []);
  return (
    <div className="device-center">
      <ScreenHeading
        eyebrow="LLEVA TU BARRIO CONTIGO"
        title="Tu app en el celular"
      />
      <section className="device-install panel">
        <div className="app-icon">
          <img src="/icon-192.png" alt="" />
        </div>
        <h2>Ciudad Escucha, a un toque</h2>
        <p>
          Ábrela desde tu pantalla de inicio, con el espacio y la comodidad de
          una aplicación.
        </p>
        <button
          className="primary"
          disabled={installed}
          onClick={async () => {
            if (install) {
              await install.prompt();
              const choice = await install.userChoice;
              if (choice.outcome === "accepted")
                setMessage("Instalación solicitada al navegador.");
              onInstalled();
            } else setHelp(true);
          }}
        >
          {installed ? <Check size={18} /> : <Download size={18} />}{" "}
          {installed ? "Abierta como aplicación" : "Instalar en mi dispositivo"}
        </button>
      </section>
      <div className="device-status" role="status">
        {offline ? <WifiOff /> : <Wifi />}
        <div>
          <strong>{offline ? "Estás sin conexión" : "Tienes conexión"}</strong>
          <small>
            {offline
              ? "Tus borradores pueden seguir contigo."
              : "Las acciones se guardan en el servidor."}
          </small>
        </div>
      </div>
      <section className="panel">
        <h2>Herramientas de tu teléfono</h2>
        {[
          [
            Camera,
            "Cámara y galería",
            "Adjunta fotos al reportar. La cámara se abre solo cuando la eliges.",
            "/reportar",
          ],
          [
            MapPin,
            "Ubicación voluntaria",
            "Usa GPS o escribe una referencia pública.",
            "/reportar",
          ],
          [
            Mic,
            "Hablar y escuchar",
            "Dictado editable y lectura de respuestas, según tu navegador.",
            "/asistente",
          ],
          [
            Share2,
            "Compartir con tus vecinos",
            "Envía el enlace de una incidencia desde su detalle.",
            "/mapa",
          ],
        ].map(([Icon, title, description, to]) => (
          <Link key={title} to={to} className="device-row">
            <Icon />
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ChevronRight size={18} />
          </Link>
        ))}
      </section>
      <section className="panel">
        <h2>Borradores y privacidad</h2>
        <p>
          El borrador se conserva en este dispositivo. Solo se publica cuando
          confirmas y el servidor responde.
        </p>
        {storage && (
          <p className="muted">
            Almacenamiento usado por este sitio:{" "}
            {(storage.usage / 1024 / 1024).toFixed(1)} MB.
          </p>
        )}
        <Link to={user ? "/reportar" : "/login"} className="secondary">
          Continuar mi reporte
          <ChevronRight size={16} />
        </Link>
        <p className="muted device-note">
          Las notificaciones internas funcionan al abrir la app. Los avisos push
          con la app cerrada aún no están habilitados.
        </p>
      </section>
      <Sheet
        open={help}
        onClose={() => setHelp(false)}
        title="Añadir a tu pantalla de inicio"
      >
        <ol className="install-steps">
          <li>
            <strong>En iPhone o iPad</strong>
            <p>
              Abre en Safari, pulsa Compartir y elige «Añadir a pantalla de
              inicio».
            </p>
          </li>
          <li>
            <strong>En Android</strong>
            <p>
              Abre el menú de Chrome o Edge y elige «Instalar aplicación» o
              «Añadir a pantalla de inicio».
            </p>
          </li>
          <li>
            <strong>Si no aparece la opción</strong>
            <p>
              Abre la app desde HTTPS o localhost, espera a que termine de
              cargar y revisa el menú del navegador.
            </p>
          </li>
        </ol>
        <button className="primary wide" onClick={() => setHelp(false)}>
          Entendido
        </button>
      </Sheet>
    </div>
  );
}
