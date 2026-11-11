import {useMascot} from "./Mascots";
import { Avatar } from "./Avatar";
import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Home,
  Map,
  Plus,
  Users,
  User,
  Settings,
  Bell,
  LogOut,
  ArrowUpRight,
  ArrowRight,
  Mic,
  ShieldCheck,
  Menu,
  X,
  Download,
  Leaf,
  MessageCircle,
  Heart,
} from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import { Provider, useApp } from "./context";
import { api } from "./api";
import { Explore, Detail, ReportForm, ReportCard } from "./Reports";
import {
  Auth,
  Welcome,
  Settings as Preferences,
  Profile,
  Community,
  Notifications,
  Operator,
} from "./Account";
import MenuVoice from "./MenuVoice";
import { Sheet } from "./Mobile";
import Assistant from "./Assistant";
import VoiceMode from "./VoiceMode";
import QuickReport from "./QuickReport";
import "./styles.css";
import "./mobile.css";
import { MobileHome, DeviceCenter } from "./Mobile";
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event("ce-update"));
  },
});
function Require({ children, operator = false }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (operator && !["operador", "administrador"].includes(user.role))
    return (
      <section className="panel">
        <h1>Acceso restringido</h1>
        <p>Este panel requiere una cuenta de operador.</p>
        <Link to="/">Volver al inicio</Link>
      </section>
    );
  return children;
}
function Tour() {
  const { prefs, savePrefs } = useApp(),
    navigate = useNavigate(),
    [step, setStep] = useState(0);
  const steps = [
    ["Inicio", "Aquí encuentras la actividad de tu comunidad."],
    ["Mapa", "Explora incidencias o usa la lista accesible."],
    [
      "Reportar",
      "Describe el problema en cuatro pasos. Tú confirmas la publicación.",
    ],
    ["Comunidad", "Conecta con vecinos y acompaña sus reportes."],
    ["Ajustes", "Adapta texto, contraste, voz y privacidad a tu ritmo."],
  ];
  useEffect(() => {
    const el = document.querySelector(`[data-tour="${steps[step][0]}"]`);
    el?.classList.add("tour-highlight");
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
    return () => el?.classList.remove("tour-highlight");
  }, [step]);
  async function finish() {
    await savePrefs({ ...prefs, onboardingCompleted: true });
    navigate("/");
  }
  return (
    <aside className="tour panel" aria-label="Recorrido guiado">
      <p className="eyebrow">PASO {step + 1} DE 5</p>
      <h2>{steps[step][0]}</h2>
      <p>{steps[step][1]}</p>
      <div className="actions">
        {step > 0 && (
          <button className="secondary" onClick={() => setStep((s) => s - 1)}>
            Atrás
          </button>
        )}
        <button
          className="primary"
          onClick={() => (step === 4 ? finish() : setStep((s) => s + 1))}
        >
          {step === 4 ? "Terminar" : "Siguiente"}
        </button>
        <button className="text-button" onClick={finish}>
          Omitir y no volver a mostrar
        </button>
      </div>
    </aside>
  );
}
function Layout() {
  const pet=useMascot();
  const {
      user,
      setUser,
      loading,
      config,
      error,
      setError,
      message,
      offline,
      prefs,
      notes,
      act,
    } = useApp(),
    location = useLocation(),
    navigate = useNavigate(),
    [install, setInstall] = useState(null),
    [update, setUpdate] = useState(false),
    [menu, setMenu] = useState(false),
    [voiceOpen, setVoiceOpen] = useState(false);
  const drawer = useRef(null);
  const touring = location.search.includes("tour=1");
  useEffect(() => {
    const el = drawer.current;
    if (!el) return;
    if (menu && !el.open) touring ? el.show() : el.showModal();
    if (!menu && el.open) el.close();
  }, [menu, touring, loading]);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstall(e);
    };
    const refreshed = () => setUpdate(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("ce-update", refreshed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("ce-update", refreshed);
    };
  }, []);
  useEffect(() => {
    setMenu(location.search.includes("tour=1"));
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  if (loading)
    return (
      <div className="loading" role="status">
        Preparando tu comunidad…
      </div>
    );
  if (!config)
    return (
      <div className="loading">
        <h1>No pudimos conectar</h1>
        <p>{error}</p>
        <button
          className="primary"
          onClick={() => location.reload?.() || window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  const authPage = ["/login", "/registro"].includes(location.pathname);
  const operator = ["operador", "administrador"].includes(user?.role);
  const nav = operator
    ? [
        ["Gestión", "/operador", ShieldCheck],
        ["Mapa", "/mapa", Map],
        ["Avisos", "/notificaciones", Bell],
        ["Perfil", "/perfil", User],
      ]
    : [
        ["Inicio", "/", Home],
        ["Mapa", "/mapa", Map],
        ["Reportar", "/reportar", Plus],
        ["Comunidad", "/comunidad", Users],
        ["Perfil", "/perfil", User],
      ];
  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      {!authPage && (
        <>
          <dialog
            ref={drawer}
            aria-label="Menú de navegación"
            onCancel={() => setMenu(false)}
            className={"sidebar " + (menu ? "open" : "")}
          >
            <button
              className="icon-button drawer-close"
              aria-label="Cerrar menú"
              onClick={() => setMenu(false)}
            >
              <X />
            </button>
            <Link to="/" className="brand">
              <img
                className="brand-image"
                src="/ciudad-escucha-logo.png"
                alt="Ciudad Escucha"
              />
            </Link>
            <nav aria-label="Navegación principal">
              {nav.map(([label, path, Icon]) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  data-tour={label}
                >
                  <Icon size={20} />
                  {label}
                </NavLink>
              ))}
              <div className="nav-divider" />
              {user && (
                <NavLink to="/mis-reportes">
                  <BookmarkIcon />
                  Mis reportes
                </NavLink>
              )}
              <NavLink to="/ajustes" data-tour="Ajustes">
                <Settings size={20} />
                Ajustes
              </NavLink>
              <NavLink to="/voz">
                <Mic size={20} />
                Modo solo voz
              </NavLink>
              <NavLink to="/rapido">
                <Plus size={20} />
                Reporte rápido con IA
              </NavLink>
              <NavLink to="/dispositivo">
                <Download size={20} />
                App y dispositivo
              </NavLink>
              {["operador", "administrador"].includes(user?.role) && (
                <NavLink to="/operador">
                  <ShieldCheck size={20} />
                  Panel de gestión
                </NavLink>
              )}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-note">
                <span className="dot" />
                Hecho para escucharnos.<p>Lima Metropolitana, Perú</p>
              </div>
              {user ? (
                <>
                  <Link className="user-chip" to="/perfil">
                    <Avatar user={user} />
                    <span>
                      <strong>{user.name}</strong>
                      <small>{user.role}</small>
                    </span>
                  </Link>
                  <button
                    className="text-button"
                    onClick={() =>
                      act(async () => {
                        await api("/auth/logout", { method: "POST", body: {} });
                        setUser(null);
                        navigate("/login");
                      }, "Sesión cerrada.")
                    }
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link className="primary" to="/login">
                  Iniciar sesión
                </Link>
              )}
            </div>
          </dialog>
          <header className="topbar">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir navegación"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
            <Link className="app-wordmark" to="/">
              <img
                className="brand-image"
                src="/ciudad-escucha-logo.png"
                alt="Ciudad Escucha"
              />
            </Link>
            <div className="actions">
              <button
                className="icon-button"
                aria-label="Hablar desde el menú principal"
                onClick={() => setVoiceOpen(true)}
              >
                <Mic size={21} />
              </button>
              <Link
                className="icon-button notification-link"
                to="/notificaciones"
                aria-label={
                  "Notificaciones: " +
                  notes.filter((n) => !n.read).length +
                  " sin leer"
                }
              >
                <Bell size={21} />
                {notes.some((n) => !n.read) && <span />}
              </Link>
              {user && (
                <Link className="avatar" to="/perfil" aria-label="Mi perfil">
                  <Avatar user={user} />
                </Link>
              )}
            </div>
          </header>
        </>
      )}
      {menu && touring && !authPage && (
        <button
          className="drawer-backdrop"
          aria-label="Cerrar navegación"
          onClick={() => setMenu(false)}
        />
      )}
      <Sheet
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        title="¿Qué necesitas?"
      >
        <>{voiceOpen && <MenuVoice onClose={() => setVoiceOpen(false)} />}</>
      </Sheet>
      <main id="main" className={authPage ? "auth-main" : "main app-content"}>
        {offline && (
          <p className="notice" role="status">
            Sin conexión. Puedes preparar un borrador. No se publicará hasta que
            vuelva la conexión.
          </p>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button aria-label="Cerrar error" onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}
        {update && (
          <p className="notice">
            Hay una actualización. Guarda tu borrador antes de{" "}
            <button className="text-button" onClick={() => updateSW(true)}>
              actualizar la aplicación
            </button>
            .
          </p>
        )}
        <Routes>
          <Route
            path="/"
            element={
              operator ? (
                <Navigate to="/operador" replace />
              ) : user?.prefs?.voiceMode ? (
                <Navigate to="/voz" replace />
              ) : (
                <MobileHome />
              )
            }
          />
          <Route
            path="/voz"
            element={
              <Require>
                <VoiceMode />
              </Require>
            }
          />
          <Route
            path="/rapido"
            element={
              <Require>
                <QuickReport />
              </Require>
            }
          />
          <Route
            path="/dispositivo"
            element={
              <DeviceCenter
                install={install}
                onInstalled={() => setInstall(null)}
              />
            }
          />
          <Route path="/login" element={<Auth />} />
          <Route path="/registro" element={<Auth register />} />
          <Route
            path="/bienvenida"
            element={
              <Require>
                <Welcome />
              </Require>
            }
          />
          <Route path="/mapa" element={<Explore />} />
          <Route
            path="/reportar"
            element={
              <Require>
                <ReportForm />
              </Require>
            }
          />
          <Route path="/incidencias/:id" element={<Detail />} />
          <Route
            path="/mis-reportes"
            element={
              <Require>
                <Explore mine />
              </Require>
            }
          />
          <Route
            path="/comunidad"
            element={
              <Require>
                <Community />
              </Require>
            }
          />
          <Route
            path="/perfil"
            element={
              <Require>
                <Profile />
              </Require>
            }
          />
          <Route
            path="/vecinos/:id"
            element={
              <Require>
                <Profile neighbor />
              </Require>
            }
          />
          <Route
            path="/ajustes"
            element={
              <Require>
                <Preferences />
              </Require>
            }
          />
          <Route
            path="/asistente"
            element={
              <Require>
                <Assistant />
              </Require>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <Require>
                <Notifications />
              </Require>
            }
          />
          <Route
            path="/operador"
            element={
              <Require operator>
                <Operator />
              </Require>
            }
          />
          <Route
            path="*"
            element={
              <section className="panel">
                <h1>Este camino no existe</h1>
                <Link to="/">Volver al inicio</Link>
              </section>
            }
          />
        </Routes>
        {!authPage && (
          <footer>Ciudad Escucha · Tu barrio, en buenas manos.</footer>
        )}
      </main>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
      {!authPage &&
        prefs.mascot !== false &&
        location.pathname != "/asistente" && (
          <Link
            className="assistant-fab"
            to="/asistente"
            aria-label={"Abrir asistente "+pet.name}
          >
            <img src={pet.image} alt="" />
            <span>¿Te ayudo?</span>
          </Link>
        )}
      {!authPage && (
        <nav className="bottom-nav" aria-label="Navegación móvil">
          {nav.map(([label, path, Icon]) => (
            <NavLink key={path} end={path === "/"} to={path}>
              <Icon size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
      {user && location.search.includes("tour=1") && <Tour />}
    </>
  );
}
function BookmarkIcon() {
  return <MessageCircle size={20} />;
}
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="loading">
        <h1>Algo interrumpió la vista</h1>
        <p>Tu borrador guardado sigue en este dispositivo.</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Volver a cargar
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Provider>
        <Layout />
      </Provider>
    </BrowserRouter>
  </ErrorBoundary>,
);
