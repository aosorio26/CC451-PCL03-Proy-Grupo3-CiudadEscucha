import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { one, run } from "./db.js";
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function checkPassword(password, hash) {
  const [salt, value] = hash.split(":");
  return timingSafeEqual(
    Buffer.from(value, "hex"),
    scryptSync(password, salt, 64),
  );
}
const digest = (t) => createHash("sha256").update(t).digest("hex");
export function session(req, res, next) {
  const token = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("ce_session="))
    ?.slice(11);
  if (token) {
    req.sessionToken = digest(token);
    req.user = one(
      "SELECT u.* FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
      req.sessionToken,
      Date.now(),
    );
  }
  next();
}
export function signIn(res, user) {
  const token = randomBytes(32).toString("hex");
  run("DELETE FROM sessions WHERE expires<?", Date.now());
  run(
    "INSERT INTO sessions VALUES(?,?,?)",
    digest(token),
    user.id,
    Date.now() + 7 * 86400000,
  );
  res.cookie("ce_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 86400000,
    path: "/",
  });
}
export function auth(req, res, next) {
  if (!req.user)
    return res.status(401).json({ error: "Inicia sesión para continuar." });
  next();
}
export const roles =
  (...allowed) =>
  (req, res, next) =>
    auth(req, res, () =>
      allowed.includes(req.user.role)
        ? next()
        : res
            .status(403)
            .json({ error: "Tu cuenta no tiene permiso para esta acción." }),
    );
