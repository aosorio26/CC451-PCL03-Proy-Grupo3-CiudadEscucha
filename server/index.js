import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { z, ZodError } from "zod";
import { db, all, one, run, transaction, dataDir } from "./db.js";
import {
  session,
  auth,
  roles,
  signIn,
  hashPassword,
  checkPassword,
} from "./auth.js";
import {
  categories,
  districts,
  statuses,
  prefsSchema,
  defaults,
  reportSchema,
} from "./domain.js";
import {
  now,
  notify,
  publicUser,
  reportView,
  listReports,
  duplicates,
  createReport,
  updateStatus,
} from "./reports.js";
import { reverseGeocode } from "./geocoding.js";
import { getProvider, mascotCatalog } from "./assistant.js";
export const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "https://tile.openstreetmap.org",
          "'self'",
          "data:",
          "blob:",
          "https://*.tile.openstreetmap.org",
        ],
        connectSrc: ["'self'"],
        workerSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: "7mb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    const allowed = [process.env.APP_ORIGIN || "http://localhost:3000"];
    if (process.env.NODE_ENV !== "production")
      allowed.push(
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      );
    if (origin && !allowed.includes(origin))
      return res.status(403).json({ error: "Origen no autorizado." });
    if (req.headers["x-requested-with"] !== "CiudadEscucha")
      return res.status(403).json({ error: "Petición no autorizada." });
  }
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: Number(process.env.API_RATE_LIMIT || 240),
    message: {error:"Hay demasiadas solicitudes. Espera un momento y vuelve a intentarlo."},
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
app.use(session);
const wrap = (fn) => (req, res, next) =>
  Promise.resolve()
    .then(() => fn(req, res))
    .catch(next);
const account = (u) => ({
  ...publicUser(u),
  name: u.name,
  email: u.email,
  learning:JSON.parse(u.learning || "{}"),
  avatar: u.avatar || null,
  bio: u.bio,
  prefs: { ...defaults, ...JSON.parse(u.prefs) },
});
const credentials = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((s) => s.toLowerCase().trim()),
  password: z.string().min(10).max(128),
});
const loginLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  message: { error: "Demasiados intentos. Espera 15 minutos." },
});
app.get("/api/health", (req, res) =>
  res.json({ ok: true, database: !!one("SELECT 1"), llm: !!getProvider() }),
);
app.get("/api/config", (req, res) =>
  res.json({
    categories,
    districts,
    statuses,
    demo: process.env.DEMO_MODE === "true",
    llm: mascotCatalog().some(m=>m.available),
    mascots:mascotCatalog(),
  }),
);
app.get("/api/me", (req, res) => res.json(req.user ? account(req.user) : null));
app.post(
  "/api/auth/register",
  loginLimit,
  wrap((req, res) => {
    const d = credentials
      .extend({ name: z.string().trim().min(2).max(60) })
      .parse(req.body);
    if (one("SELECT id FROM users WHERE email=?", d.email))
      return res
        .status(400)
        .json({
          error:
            "No se pudo crear la cuenta con estos datos. Prueba iniciar sesión.",
        });
    const id = randomUUID();
    run(
      "INSERT INTO users(id,name,email,password,created) VALUES(?,?,?,?,?)",
      id,
      d.name,
      d.email,
      hashPassword(d.password),
      now(),
    );
    const u = one("SELECT * FROM users WHERE id=?", id);
    signIn(res, u);
    res.status(201).json(account(u));
  }),
);
app.post(
  "/api/auth/login",
  loginLimit,
  wrap((req, res) => {
    const d = credentials.parse(req.body);
    const u = one("SELECT * FROM users WHERE email=?", d.email);
    if (!u || !checkPassword(d.password, u.password))
      return res
        .status(401)
        .json({ error: "Correo o contraseña incorrectos." });
    signIn(res, u);
    res.json(account(u));
  }),
);
app.post("/api/auth/logout", (req, res) => {
  if (req.sessionToken)
    run("DELETE FROM sessions WHERE token=?", req.sessionToken);
  res.clearCookie("ce_session", { path: "/" }).json({ ok: true });
});
app.put(
  "/api/me",
  auth,
  wrap((req, res) => {
    const d = z
      .object({
        name: z.string().trim().min(2).max(60),
        bio: z.string().max(240),
      })
      .parse(req.body);
    run("UPDATE users SET name=?,bio=? WHERE id=?", d.name, d.bio, req.user.id);
    res.json(account(one("SELECT * FROM users WHERE id=?", req.user.id)));
  }),
);
function recordLearning(id,event){
 const u=one("SELECT * FROM users WHERE id=?",id),prefs={...defaults,...JSON.parse(u.prefs)},learning=JSON.parse(u.learning||"{}");
 if(prefs.adaptive){learning[event]=(learning[event]||0)+1;learning.updated=now();
 if(event==="voiceError" && learning.voiceError%2===0){prefs.voicePause=8;prefs.rate=Math.min(prefs.rate,0.85);learning.adjustment="Amplié la pausa y reduje la velocidad para escucharte con más calma.";}
 if(event==="correction" && learning.correction%3===0){prefs.tone="Guiado/paciente";learning.adjustment="Usaré indicaciones más pausadas al revisar tus reportes.";}
 run("UPDATE users SET prefs=?,learning=? WHERE id=?",JSON.stringify(prefs),JSON.stringify(learning),id);}
 return {prefs,learning};
}
app.post("/api/me/usage",auth,wrap((req,res)=>{const event=z.enum(["voiceError","voiceTurn"]).parse(req.body.event);res.json(recordLearning(req.user.id,event));}));
app.delete("/api/me/usage",auth,(req,res)=>{run("UPDATE users SET learning='{}' WHERE id=?",req.user.id);res.json({ok:true});});
app.put(
  "/api/preferences",
  auth,
  wrap((req, res) => {
    const p = prefsSchema.parse(req.body);
    transaction(() => {
      run(
        "UPDATE users SET prefs=? WHERE id=?",
        JSON.stringify(p),
        req.user.id,
      );
      if (!p.history)
        run("DELETE FROM conversations WHERE user_id=?", req.user.id);
    });
    res.json(p);
  }),
);
app.get("/api/export", auth, (req, res) =>
  res.json({
    profile: account(req.user),
    conversations: all(
      "SELECT role,content,created FROM conversations WHERE user_id=?",
      req.user.id,
    ),
    reports: all("SELECT * FROM reports WHERE user_id=?", req.user.id),
  }),
);
app.get("/api/reports", (req, res) => res.json(listReports(req.user)));
app.post(
  "/api/reports/duplicates",
  auth,
  wrap((req, res) => res.json(duplicates(reportSchema.parse(req.body)))),
);
app.post(
  "/api/reports",
  auth,
  wrap((req, res) => {
    if (req.body.confirmed !== true)
      return res
        .status(400)
        .json({ error: "Confirma expresamente antes de publicar." });
    res
      .status(201)
      .json(reportView(createReport(req.user, req.body), req.user));
  }),
);
app.get(
  "/api/reports/:id",
  wrap((req, res) => {
    const r = one("SELECT * FROM reports WHERE id=?", req.params.id);
    if (!r)
      return res.status(404).json({ error: "No encontramos esa incidencia." });
    res.json({
      ...reportView(r, req.user),
      history: all(
        "SELECT h.*,u.name actor FROM history h JOIN users u ON h.user_id=u.id WHERE report_id=? ORDER BY h.id",
        r.id,
      ),
      discussion: all(
        "SELECT c.*,u.name,u.prefs FROM comments c JOIN users u ON c.user_id=u.id WHERE report_id=? AND hidden=0 ORDER BY created",
        r.id,
      ).map((c) => ({
        ...c,
        name: JSON.parse(c.prefs).publicProfile === false ? "Vecino" : c.name,
        prefs: undefined,
      })),
    });
  }),
);
app.put(
  "/api/reports/:id/support",
  auth,
  wrap((req, res) => {
    const active = z.boolean().parse(req.body.active);
    const r = one("SELECT * FROM reports WHERE id=?", req.params.id);
    if (!r) return res.sendStatus(404);
    if (r.user_id === req.user.id)
      return res
        .status(400)
        .json({ error: "Los apoyos son de otros vecinos." });
    transaction(() => {
      if (active) {
        const result = run(
          "INSERT OR IGNORE INTO supports VALUES(?,?)",
          req.user.id,
          r.id,
        );
        if (result.changes)
          notify(r.user_id, "Un vecino apoyó tu reporte.", r.id);
      } else
        run(
          "DELETE FROM supports WHERE user_id=? AND report_id=?",
          req.user.id,
          r.id,
        );
    });
    res.json(reportView(r, req.user));
  }),
);
app.put(
  "/api/reports/:id/follow",
  auth,
  wrap((req, res) => {
    const active = z.boolean().parse(req.body.active);
    if (!one("SELECT id FROM reports WHERE id=?", req.params.id))
      return res.sendStatus(404);
    if (active)
      run(
        "INSERT OR IGNORE INTO follows VALUES(?,?)",
        req.user.id,
        req.params.id,
      );
    else
      run(
        "DELETE FROM follows WHERE user_id=? AND report_id=?",
        req.user.id,
        req.params.id,
      );
    res.json({ ok: true });
  }),
);
app.post(
  "/api/reports/:id/comments",
  auth,
  wrap((req, res) => {
    const body = z.string().trim().min(2).max(1000).parse(req.body.body);
    const r = one("SELECT * FROM reports WHERE id=?", req.params.id);
    if (!r) return res.sendStatus(404);
    transaction(() => {
      run(
        "INSERT INTO comments(id,user_id,report_id,body,created) VALUES(?,?,?,?,?)",
        randomUUID(),
        req.user.id,
        r.id,
        body,
        now(),
      );
      for (const u of all(
        "SELECT user_id FROM follows WHERE report_id=? UNION SELECT user_id FROM reports WHERE id=?",
        r.id,
        r.id,
      ))
        if (u.user_id !== req.user.id)
          notify(
            u.user_id,
            "Hay un nuevo comentario en una incidencia que sigues.",
            r.id,
          );
    });
    res.status(201).json({ ok: true });
  }),
);
app.put(
  "/api/comments/:id",
  auth,
  wrap((req, res) => {
    const body = z.string().trim().min(2).max(1000).parse(req.body.body);
    const result = run(
      "UPDATE comments SET body=? WHERE id=? AND user_id=?",
      body,
      req.params.id,
      req.user.id,
    );
    res.status(result.changes ? 200 : 403).json({ ok: !!result.changes });
  }),
);
app.delete("/api/comments/:id", auth, (req, res) => {
  const result = run(
    "DELETE FROM comments WHERE id=? AND user_id=?",
    req.params.id,
    req.user.id,
  );
  res.status(result.changes ? 200 : 403).json({ ok: !!result.changes });
});
app.post(
  "/api/comments/:id/flag",
  auth,
  wrap((req, res) => {
    if (!one("SELECT id FROM comments WHERE id=?", req.params.id))
      return res.sendStatus(404);
    run(
      "INSERT OR IGNORE INTO flags VALUES(?,?,?)",
      req.user.id,
      req.params.id,
      z.string().min(3).max(250).parse(req.body.reason),
    );
    res.json({ ok: true });
  }),
);
app.get("/api/notifications", auth, (req, res) =>
  res.json(
    all(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created DESC LIMIT 100",
      req.user.id,
    ),
  ),
);
app.put("/api/notifications/read", auth, (req, res) => {
  run("UPDATE notifications SET read=1 WHERE user_id=?", req.user.id);
  res.json({ ok: true });
});
app.get("/api/users", auth, (req, res) =>
  res.json(all("SELECT * FROM users").map(publicUser)),
);
app.get("/api/users/:id", auth, (req, res) => {
  const u = one("SELECT * FROM users WHERE id=?", req.params.id);
  if (!u) return res.sendStatus(404);
  res.json({
    ...publicUser(u),
    relations: all(
      "SELECT user_id,target_id,kind,status FROM neighbors WHERE user_id=? OR target_id=?",
      u.id,
      u.id,
    ),
    reports:
      JSON.parse(u.prefs).publicProfile !== false
        ? listReports(req.user).filter((r) => r.user_id === u.id)
        : [],
  });
});
app.put(
  "/api/users/:id/relation",
  auth,
  wrap((req, res) => {
    const d = z
      .object({
        kind: z.enum(["follow", "friend"]),
        action: z.enum(["request", "accept", "remove"]),
      })
      .parse(req.body);
    const target = req.params.id;
    if (
      target === req.user.id ||
      !one("SELECT id FROM users WHERE id=?", target)
    )
      return res.status(400).json({ error: "Vecino no válido." });
    transaction(() => {
      if (d.action === "remove") {
        run(
          "DELETE FROM neighbors WHERE user_id=? AND target_id=? AND kind=?",
          req.user.id,
          target,
          d.kind,
        );
        if (d.kind === "friend")
          run(
            "DELETE FROM neighbors WHERE user_id=? AND target_id=? AND kind='friend'",
            target,
            req.user.id,
          );
      } else if (d.action === "accept") {
        const r = run(
          "UPDATE neighbors SET status='accepted' WHERE user_id=? AND target_id=? AND kind='friend' AND status='pending'",
          target,
          req.user.id,
        );
        if (!r.changes)
          throw Object.assign(new Error("No hay solicitud pendiente."), {
            status: 400,
          });
        notify(target, "Tu solicitud de amistad fue aceptada.");
      } else {
        const existing =
          d.kind === "friend"
            ? one(
                "SELECT 1 FROM neighbors WHERE kind='friend' AND ((user_id=? AND target_id=?) OR (user_id=? AND target_id=?))",
                target,
                req.user.id,
                req.user.id,
                target,
              )
            : null;
        if (!existing) {
          const r = run(
            "INSERT OR IGNORE INTO neighbors VALUES(?,?,?,?)",
            req.user.id,
            target,
            d.kind,
            d.kind === "friend" ? "pending" : "accepted",
          );
          if (r.changes)
            notify(
              target,
              d.kind === "friend"
                ? "Recibiste una solicitud de amistad. Revisa Comunidad."
                : "Un vecino empezó a seguirte.",
            );
        }
      }
    });
    res.json({ ok: true });
  }),
);
app.get("/api/relations", auth, (req, res) =>
  res.json(
    all(
      "SELECT * FROM neighbors WHERE user_id=? OR target_id=?",
      req.user.id,
      req.user.id,
    ),
  ),
);
app.get(
  "/api/operator/summary",
  roles("operador", "administrador"),
  (req, res) =>
    res.json({
      districts: all(
        "SELECT district,status,COUNT(*) count FROM reports GROUP BY district,status",
      ),
      staff: all(
        "SELECT id,name,role FROM users WHERE role IN ('operador','administrador')",
      ),
      flags: all(
        "SELECT c.id,c.body,COUNT(*) count FROM flags f JOIN comments c ON c.id=f.comment_id WHERE c.hidden=0 GROUP BY c.id",
      ),
    }),
);
app.put(
  "/api/operator/reports/:id",
  roles("operador", "administrador"),
  wrap((req, res) => {
    const d = z
      .object({
        status: z.enum(statuses),
        note: z.string().trim().min(5).max(400),
        assigned: z.string().nullable().optional(),
        confirmed: z.literal(true),
      })
      .parse(req.body);
    res.json(
      updateStatus(req.user, req.params.id, d.status, d.note, d.assigned),
    );
  }),
);
app.put(
  "/api/operator/comments/:id/hide",
  roles("operador", "administrador"),
  (req, res) => {
    run("UPDATE comments SET hidden=1 WHERE id=?", req.params.id);
    res.json({ ok: true });
  },
);
app.put(
  "/api/admin/users/:id/role",
  roles("administrador"),
  wrap((req, res) => {
    const role = z
      .enum(["ciudadano", "operador", "administrador"])
      .parse(req.body.role);
    if (req.user.id === req.params.id)
      return res
        .status(400)
        .json({ error: "No puedes cambiar tu propio rol." });
    run("UPDATE users SET role=? WHERE id=?", role, req.params.id);
    res.json({ ok: true });
  }),
);
const uploads = path.join(dataDir, "uploads");
mkdirSync(uploads, { recursive: true });
app.post(
  "/api/uploads",
  auth,
  wrap(async (req, res) => {
    const data = z
      .string()
      .max(7000000)
      .regex(/^data:image\/(jpeg|png|webp);base64,/)
      .parse(req.body.image);
    const buffer = Buffer.from(data.split(",")[1], "base64");
    if (buffer.length > 5 * 1024 * 1024)
      return res
        .status(400)
        .json({ error: "La foto debe pesar menos de 5 MB." });
    const id = randomUUID() + ".webp";
    await sharp(buffer, { limitInputPixels: 24000000 })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(path.join(uploads, id));
    res.json({ url: "/uploads/" + id });
  }),
);
app.put("/api/me/avatar", auth, wrap(async (req, res) => {
  const { image } = z.object({image: z.string().max(7000000).regex(/^data:image\/(jpeg|png|webp);base64,/).nullable()}).parse(req.body);
  let url = null;
  if (image !== null) {
    const buffer = Buffer.from(image.split(",")[1], "base64");
    if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({error:"El avatar debe pesar menos de 5 MB."});
    const id = randomUUID() + ".webp";
    try {
      await sharp(buffer, {limitInputPixels:24000000}).rotate().resize(512,512,{fit:"cover"}).webp({quality:82}).toFile(path.join(uploads,id));
    } catch { return res.status(400).json({error:"No pudimos leer esa imagen. Usa JPG, PNG o WebP válido."}); }
    url = "/uploads/" + id;
  }
  run("UPDATE users SET avatar=? WHERE id=?", url, req.user.id);
  res.json(account(one("SELECT * FROM users WHERE id=?", req.user.id)));
}));
app.use("/uploads", express.static(uploads, { maxAge: 0 }));
app.get("/api/assistant/history", auth, (req, res) =>
  res.json(
    all(
      "SELECT role,content,created FROM conversations WHERE user_id=? ORDER BY id DESC LIMIT 40",
      req.user.id,
    ).reverse(),
  ),
);
app.delete("/api/assistant/history", auth, (req, res) => {
  run("DELETE FROM conversations WHERE user_id=?", req.user.id);
  res.json({ ok: true });
});
app.get("/api/geocode/reverse", auth, rateLimit({windowMs:60000,limit:20}), wrap(async(req,res)=>{
 const lat=z.coerce.number().min(-12.6).max(-11.5).parse(req.query.lat),lng=z.coerce.number().min(-77.3).max(-76.5).parse(req.query.lng);
 try{res.json(await reverseGeocode(lat,lng));}catch(e){res.status(503).json({error:e.message});}
}));
app.post(
  "/api/assistant/message",
  auth,
  rateLimit({ windowMs: 60000, limit: 15 }),
  wrap(async (req, res) => {
    const message = z.string().trim().min(1).max(6000).parse(req.body.message);
    const selectedPrefs={...defaults,...JSON.parse(req.user.prefs)};
    const provider = getProvider(selectedPrefs.mascotId);
    if (!provider)
      return res
        .status(503)
        .json({
          error:
            "Asistente IA no disponible. Puedes usar el formulario o la guía local, que no utiliza un LLM.",
        });
    if (req.body.consent !== true)
      return res
        .status(400)
        .json({ error: "Autoriza enviar este texto al proveedor de IA." });
    const prefs = { ...defaults, ...JSON.parse(req.user.prefs) };
    const context = {
      mascotName: prefs.mascotId === "rabbit2" ? "Rescue Rabbit 2" : "Rescue Rabbit 1",
      emotion:prefs.emotion,
      rhythm:{rate:prefs.rate,pause:prefs.voicePause},
      learning:JSON.parse(req.user.learning || "{}"),
      draft: req.body.draft ? reportSchema.partial().extend({title:z.string().max(120).optional(),description:z.string().max(2000).optional(),address:z.string().max(250).optional()}).parse(req.body.draft) : {},
      mode: req.body.mode === "voice" ? "voice" : "text",
      conversation: z.array(z.object({role:z.enum(["user","assistant"]),text:z.string().max(6000)})).max(10).parse(req.body.conversation || []),
      recent: all(
        "SELECT id,title,status,district FROM reports WHERE user_id=? ORDER BY created DESC LIMIT 5",
        req.user.id,
      ),
      history: prefs.history
        ? all(
            "SELECT role,content FROM conversations WHERE user_id=? ORDER BY id DESC LIMIT 6",
            req.user.id,
          ).reverse()
        : [],
    };
    const result = await provider.suggest(message, context, prefs.tone);
    if (prefs.history) {
      run(
        "INSERT INTO conversations(user_id,role,content,created) VALUES(?,?,?,?)",
        req.user.id,
        "user",
        message,
        now(),
      );
      run(
        "INSERT INTO conversations(user_id,role,content,created) VALUES(?,?,?,?)",
        req.user.id,
        "assistant",
        result.reply,
        now(),
      );
    }
    const keys=["title","description","category","district","address","urgency"];
    const merged={...context.draft};
    for(const key of keys) if(result[key] !== undefined && result[key] !== "") merged[key]=result[key];
    if(merged.district && (merged.district !== context.draft.district || !Number.isFinite(merged.lat))) [merged.lat,merged.lng]=districts[merged.district];
    merged.urgency ||= "Media";
    recordLearning(req.user.id, "conversations");
    if(keys.some(k=>context.draft[k] && result[k] && context.draft[k]!==result[k])) recordLearning(req.user.id,"correction");
    const validated=reportSchema.safeParse(merged);
    if(result.intent === "draft"){
      if(validated.success) result.reply="Tu borrador está listo. Revísalo y confirma o dime qué cambiamos.";
      else {const first=validated.error.issues[0]?.path[0];result.reply=({title:"¿Cómo resumirías el problema?",description:"Cuéntame un poco más de lo que ocurrió.",category:"¿Qué tipo de problema es?",district:"¿En qué distrito ocurrió?",address:"¿Cuál es la dirección o referencia?",lat:"Necesito confirmar el distrito de la incidencia.",lng:"Necesito confirmar la ubicación."})[first] || "Revisemos la información que falta en el borrador.";}
    }
    let matches, count, queryReply;
    if(result.intent === "query" && result.query){
      const q=result.query; let rows=listReports(req.user);
      if(q.scope === "mine") rows=rows.filter(r=>r.user_id===req.user.id);
      else if(q.scope === "following") rows=rows.filter(r=>r.following);
      else if(q.scope === "district") rows=rows.filter(r=>r.district===(q.district || prefs.district));
      else {
        const normalize=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
        const users=all("SELECT * FROM users").filter(u=>JSON.parse(u.prefs).publicProfile!==false && normalize(u.name)===normalize(q.userName || ""));
        if(users.length!==1){rows=[];queryReply=users.length ? "Hay varios vecinos con ese nombre. Indícame su alias completo." : "No encontré un perfil público con ese nombre.";} else rows=rows.filter(r=>r.user_id===users[0].id);
      }
      if(q.status) rows=rows.filter(r=>r.status===q.status);
      count=rows.length;matches=rows.slice(0,20).map(r=>({id:r.id,title:r.title,status:r.status,district:r.district,address:r.address,description:r.description}));
      queryReply ||= count ? `Encontré ${count} reportes. ${matches.slice(0,3).map(r=>r.title+": "+r.status).join(". ")}.` : "No encontré reportes para esa consulta.";
    }
    res.json({...result,mascotId:prefs.mascotId,mascotName:context.mascotName,reply:queryReply || result.reply,source:"LLM",draft:merged,ready:validated.success,reports:matches,count});
  }),
);
app.post(
  "/api/assistant/drafts",
  auth,
  wrap((req, res) => {
    const draft = reportSchema.parse(req.body);
    const id = randomUUID();
    run(
      "INSERT INTO drafts(id,user_id,payload,created) VALUES(?,?,?,?)",
      id,
      req.user.id,
      JSON.stringify(draft),
      now(),
    );
    res.json({
      id,
      draft,
      duplicates: duplicates(draft),
      requiresConfirmation: true,
    });
  }),
);
app.post(
  "/api/assistant/drafts/:id/confirm",
  auth,
  wrap((req, res) => {
    z.literal(true).parse(req.body.confirmed);
    const draft = one(
      "SELECT * FROM drafts WHERE id=? AND user_id=?",
      req.params.id,
      req.user.id,
    );
    if (!draft) return res.sendStatus(404);
    const r = draft.report_id
      ? one("SELECT * FROM reports WHERE id=?", draft.report_id)
      : createReport(req.user, {
          ...JSON.parse(draft.payload),
          request_key: draft.id,
        });
    run("UPDATE drafts SET report_id=? WHERE id=?", r.id, draft.id);
    res.json(r);
  }),
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Recurso no encontrado." }),
);
if (existsSync(path.resolve("dist/index.html"))) {
  app.use(express.static("dist"));
  app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
}
app.use((err, req, res, next) => {
  if (err instanceof ZodError)
    return res
      .status(400)
      .json({
        error:
          "Revisa los campos: " +
          err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
  console.error(err.name, err.message);
  res
    .status(err.status || 500)
    .json({
      error: err.status
        ? err.message
        : "No pudimos completar la acción. Tus datos no se han confirmado; vuelve a intentarlo.",
    });
});
if (process.env.NODE_ENV !== "test")
  app.listen(
    Number(process.env.PORT || 3000),
    process.env.HOST || "127.0.0.1",
    () =>
      console.log(
        `Ciudad Escucha: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3000}`,
      ),
  );
