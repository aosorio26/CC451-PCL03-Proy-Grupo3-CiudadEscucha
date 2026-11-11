import { Avatar } from "./Avatar";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "./context";
import { api } from "./api";
const levels = [
  ["Primera voz", 0],
  ["Vecino atento", 50],
  ["Aliado del barrio", 150],
  ["Impulsor comunitario", 350],
  ["Referente vecinal", 700],
];
export function LevelProgress({ points }) {
  const current = levels.filter((l) => points >= l[1]).at(-1),
    next = levels.find((l) => l[1] > points);
  return (
    <div className="level-progress">
      <h3>{current[0]}</h3>
      <p>
        {next
          ? `Te faltan ${next[1] - points} puntos para ${next[0]}.`
          : "Alcanzaste el nivel más alto. Gracias por cuidar tu comunidad."}
      </p>
      <progress
        aria-label="Progreso al siguiente nivel"
        value={next ? points - current[1] : 1}
        max={next ? next[1] - current[1] : 1}
      />
      <ol>
        {levels.map(([name, min]) => (
          <li key={name}>
            <strong>{name}</strong> · {min} puntos {points >= min ? "✓" : ""}
          </li>
        ))}
      </ol>
      <p>
        Los puntos reflejan las contribuciones registradas; no otorgan
        privilegios de gestión.
      </p>
    </div>
  );
}
export function Friends() {
  const { user } = useApp(),
    [friends, setFriends] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api("/users"), api("/relations")])
      .then(([users, relations]) => {
        const ids = new Set(
          relations
            .filter((r) => r.kind === "friend" && r.status === "accepted")
            .map((r) => (r.user_id === user.id ? r.target_id : r.user_id)),
        );
        setFriends(users.filter((u) => ids.has(u.id)));
      })
      .catch((e) => setError(e.message));
  }, [user.id]);
  return (
    <section className="panel">
      <h2>Mis amigos</h2>
      <p>Entra a su perfil para acompañar sus incidencias.</p>
      {error && <p role="alert">{error}</p>}
      {!error && !friends.length && (
        <p>Aún no hay amistades aceptadas. Conoce vecinos en Comunidad.</p>
      )}
      {friends.map((u) => (
        <Link className="neighbor" key={u.id} to={"/vecinos/" + u.id}>
          <Avatar user={u} />
          <span>
            <strong>{u.name}</strong>
            <small>
              {u.publicProfile
                ? `${u.stats.reports} reportes · Ver perfil`
                : "Perfil privado"}
            </small>
          </span>
        </Link>
      ))}
    </section>
  );
}
