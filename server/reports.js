import { randomUUID } from "node:crypto";
import { all, one, run, transaction } from "./db.js";
import { reportSchema, defaults } from "./domain.js";
export const now = () => new Date().toISOString();
export function notify(userId, body, reportId = null) {
  const u = one("SELECT prefs FROM users WHERE id=?", userId);
  if (u && JSON.parse(u.prefs).notifications !== false)
    run(
      "INSERT INTO notifications(id,user_id,report_id,body,created) VALUES(?,?,?,?,?)",
      randomUUID(),
      userId,
      reportId,
      body,
      now(),
    );
}
export function publicUser(u) {
  const prefs = { ...defaults, ...JSON.parse(u.prefs) };
  const stats = {
    reports: one("SELECT COUNT(*) n FROM reports WHERE user_id=?", u.id).n,
    supports: one("SELECT COUNT(*) n FROM supports WHERE user_id=?", u.id).n,
    following: one("SELECT COUNT(*) n FROM follows WHERE user_id=?", u.id).n,
    resolved: one(
      "SELECT COUNT(*) n FROM reports WHERE user_id=? AND status='Resuelto'",
      u.id,
    ).n,
  };
  const validated = one(
    "SELECT COUNT(*) n FROM reports WHERE user_id=? AND status IN ('En atención','Resuelto')",
    u.id,
  ).n;
  return {
    id: u.id,
    name: prefs.publicProfile ? u.name : "Vecino",
    bio: prefs.publicProfile ? u.bio : "",
    avatar: prefs.publicProfile ? u.avatar || null : null,
    role: u.role,
    stats,
    points: prefs.achievements
      ? validated * 10 + stats.supports * 2 + stats.resolved * 5
      : null,
    publicProfile: prefs.publicProfile,
  };
}
export function reportView(r, user) {
  return {
    ...r,
    author: publicUser(one("SELECT * FROM users WHERE id=?", r.user_id)),
    supports: one("SELECT COUNT(*) n FROM supports WHERE report_id=?", r.id).n,
    comments: one(
      "SELECT COUNT(*) n FROM comments WHERE report_id=? AND hidden=0",
      r.id,
    ).n,
    supported: !!one(
      "SELECT 1 FROM supports WHERE report_id=? AND user_id=?",
      r.id,
      user?.id || "",
    ),
    following: !!one(
      "SELECT 1 FROM follows WHERE report_id=? AND user_id=?",
      r.id,
      user?.id || "",
    ),
  };
}
export function listReports(user) {
  return all("SELECT * FROM reports ORDER BY created DESC").map((r) =>
    reportView(r, user),
  );
}
export function duplicates(draft) {
  return all(
    "SELECT id,title,district,status,lat,lng FROM reports WHERE category=? AND district=? AND status NOT IN ('Rechazado','Resuelto')",
    draft.category,
    draft.district,
  ).filter(
    (r) =>
      Math.hypot((r.lat - draft.lat) * 111, (r.lng - draft.lng) * 109) < 0.7,
  );
}
export function createReport(user, payload) {
  const d = reportSchema.parse(payload);
  return transaction(() => {
    if (d.request_key) {
      const existing = one(
        "SELECT * FROM reports WHERE user_id=? AND request_key=?",
        user.id,
        d.request_key,
      );
      if (existing) return existing;
    }
    const id = randomUUID();
    run(
      "INSERT INTO reports(id,user_id,title,description,category,district,address,lat,lng,urgency,photo,photo_alt,created,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id,
      user.id,
      d.title,
      d.description,
      d.category,
      d.district,
      d.address,
      d.lat,
      d.lng,
      d.urgency,
      d.photo || null,
      d.photo_alt,
      now(),
      d.request_key || null,
    );
    run(
      "INSERT INTO history(report_id,user_id,status,note,created) VALUES(?,?,?,?,?)",
      id,
      user.id,
      "Reportado",
      "Publicado por el vecino",
      now(),
    );
    run("INSERT INTO follows VALUES(?,?)", user.id, id);
    return one("SELECT * FROM reports WHERE id=?", id);
  });
}
export function updateStatus(user, id, status, note, assigned) {
  return transaction(() => {
    const r = one("SELECT * FROM reports WHERE id=?", id);
    if (!r)
      throw Object.assign(new Error("Incidencia no encontrada."), {
        status: 404,
      });
    if (
      assigned &&
      !one(
        "SELECT id FROM users WHERE id=? AND role IN ('operador','administrador')",
        assigned,
      )
    )
      throw Object.assign(new Error("Operador no válido."), { status: 400 });
    run(
      "UPDATE reports SET status=?,assigned=? WHERE id=?",
      status,
      assigned || null,
      id,
    );
    run(
      "INSERT INTO history(report_id,user_id,status,note,created) VALUES(?,?,?,?,?)",
      id,
      user.id,
      status,
      note,
      now(),
    );
    for (const f of all(
      "SELECT user_id FROM follows WHERE report_id=? UNION SELECT user_id FROM reports WHERE id=?",
      id,
      id,
    )) {
      if (f.user_id !== user.id)
        notify(
          f.user_id,
          `${r.title}: ${status}. Actualización del equipo de demostración.`,
          id,
        );
    }
    return one("SELECT * FROM reports WHERE id=?", id);
  });
}
