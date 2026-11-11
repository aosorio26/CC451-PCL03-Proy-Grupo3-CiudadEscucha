import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
process.env.NODE_ENV = "test";
process.env.LLM_PROVIDER = "none";
process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), "ciudad-test-"));
const { app } = await import("../server/index.js");
const { one, run, db } = await import("../server/db.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = "http://127.0.0.1:" + server.address().port;
function client() {
  let cookie = "";
  return async (url, method = "GET", body) => {
    const r = await fetch(base + "/api" + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "CiudadEscucha",
        cookie,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (r.headers.get("set-cookie"))
      cookie = r.headers.get("set-cookie").split(";")[0];
    return { status: r.status, data: await r.json().catch(() => null) };
  };
}
const lucia = client(),
  julio = client(),
  karina = client(),
  admin = client(),
  anonymous = client();
let l, j, k, a, report, comment;
const draft = {
  title: "Semáforo apagado en avenida",
  description: "El semáforo del cruce está apagado desde esta mañana.",
  category: "Semáforos",
  district: "Los Olivos",
  address: "Cruce público de prueba",
  lat: -11.991,
  lng: -77.071,
  urgency: "Media",
  request_key: crypto.randomUUID(),
};
test("registro, sesiones independientes y rol no escalable", async () => {
  for (const [c, name] of [
    [lucia, "Lucía"],
    [julio, "Julio"],
    [karina, "Karina"],
    [admin, "Admin"],
  ]) {
    const r = await c("/auth/register", "POST", {
      name,
      email: name.toLowerCase().replace("í", "i") + "@test.local",
      password: "ContraseñaSegura2026!",
      role: "administrador",
    });
    assert.equal(r.status, 201);
    assert.equal(r.data.role, "ciudadano");
  }
  l = (await lucia("/me")).data;
  j = (await julio("/me")).data;
  k = (await karina("/me")).data;
  a = (await admin("/me")).data;
  assert.notEqual(l.id, j.id);
  assert.equal((await anonymous("/notifications")).status, 401);
  run("UPDATE users SET role='operador' WHERE id=?", k.id);
  run("UPDATE users SET role='administrador' WHERE id=?", a.id);
});
test("publicación requiere confirmación y tiene idempotencia", async () => {
  assert.equal((await lucia("/reports", "POST", draft)).status, 400);
  const result = await lucia("/reports", "POST", { ...draft, confirmed: true });
  assert.equal(result.status, 201);
  report = result.data;
  const second = await lucia("/reports", "POST", { ...draft, confirmed: true });
  assert.equal(second.data.id, report.id);
  assert.equal((await julio("/reports")).data.length, 1);
  assert.equal(
    (await lucia("/reports/duplicates", "POST", draft)).data[0].id,
    report.id,
  );
});
test("apoyo único, autoapoyo impedido y contador compartido", async () => {
  assert.equal(
    (await lucia("/reports/" + report.id + "/support", "PUT", { active: true }))
      .status,
    400,
  );
  for (let i = 0; i < 3; i++)
    assert.equal(
      (
        await julio("/reports/" + report.id + "/support", "PUT", {
          active: true,
        })
      ).status,
      200,
    );
  assert.equal((await lucia("/reports/" + report.id)).data.supports, 1);
  assert.ok((await lucia("/notifications")).data.length);
});
test("comentarios, edición propia, denuncia y moderación", async () => {
  await julio("/reports/" + report.id + "/comments", "POST", {
    body: "También observé el problema <script>alert(1)</script>",
  });
  let detail = (await lucia("/reports/" + report.id)).data;
  comment = detail.discussion[0];
  assert.equal(detail.discussion.length, 1);
  assert.equal(
    (await lucia("/comments/" + comment.id, "PUT", { body: "No soy el autor" }))
      .status,
    403,
  );
  assert.equal(
    (
      await julio("/comments/" + comment.id, "PUT", {
        body: "Comentario corregido por su autor",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await lucia("/comments/" + comment.id + "/flag", "POST", {
        reason: "Revisar contenido",
      })
    ).status,
    200,
  );
  assert.equal((await karina("/operator/summary")).data.flags.length, 1);
  await karina("/operator/comments/" + comment.id + "/hide", "PUT", {});
  assert.equal(
    (await lucia("/reports/" + report.id)).data.discussion.length,
    0,
  );
});
test("seguimiento, cambio de estado con autorización y notificaciones", async () => {
  await julio("/reports/" + report.id + "/follow", "PUT", { active: true });
  const change = {
    status: "En atención",
    note: "Verificación de demostración",
    confirmed: true,
    assigned: k.id,
  };
  assert.equal(
    (await julio("/operator/reports/" + report.id, "PUT", change)).status,
    403,
  );
  assert.equal(
    (
      await karina("/operator/reports/" + report.id, "PUT", {
        ...change,
        confirmed: false,
      })
    ).status,
    400,
  );
  assert.equal(
    (await karina("/operator/reports/" + report.id, "PUT", change)).status,
    200,
  );
  const detail = (await julio("/reports/" + report.id)).data;
  assert.equal(detail.status, "En atención");
  assert.equal(detail.history.length, 2);
  assert.ok(
    (await julio("/notifications")).data.some((n) =>
      n.body.includes("En atención"),
    ),
  );
  assert.equal((await lucia("/users/" + l.id)).data.points, 10);
});
test("amistad requiere aceptación, seguimiento unilateral y privacidad", async () => {
  await julio("/users/" + l.id + "/relation", "PUT", {
    kind: "follow",
    action: "request",
  });
  await julio("/users/" + l.id + "/relation", "PUT", {
    kind: "friend",
    action: "request",
  });
  assert.equal(
    (
      await julio("/users/" + l.id + "/relation", "PUT", {
        kind: "friend",
        action: "accept",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await lucia("/users/" + j.id + "/relation", "PUT", {
        kind: "friend",
        action: "accept",
      })
    ).status,
    200,
  );
  const relations = (await lucia("/relations")).data;
  assert.equal(
    relations.filter((r) => r.kind === "friend" && r.status === "accepted")
      .length,
    1,
  );
  await lucia("/preferences", "PUT", {
    publicProfile: false,
    theme: "dark",
    fontSize: 160,
  });
  const p = (await julio("/users/" + l.id)).data;
  assert.equal(p.name, "Vecino");
  assert.equal(p.email, undefined);
  assert.equal(p.reports.length, 0);
  assert.equal((await lucia("/me")).data.prefs.fontSize, 160);
});
test("LLM ausente explícito y borrador conversacional confirmado una sola vez", async () => {
  assert.equal(
    (
      await lucia("/assistant/message", "POST", {
        message: "Hola",
        consent: true,
      })
    ).status,
    503,
  );
  const prepared = (
    await lucia("/assistant/drafts", "POST", {
      ...draft,
      title: "Otro reporte desde conversación",
      request_key: crypto.randomUUID(),
    })
  ).data;
  assert.ok(prepared.requiresConfirmation);
  assert.equal(
    (
      await julio("/assistant/drafts/" + prepared.id + "/confirm", "POST", {
        confirmed: true,
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await lucia("/assistant/drafts/" + prepared.id + "/confirm", "POST", {
        confirmed: false,
      })
    ).status,
    400,
  );
  const r1 = await lucia(
      "/assistant/drafts/" + prepared.id + "/confirm",
      "POST",
      { confirmed: true },
    ),
    r2 = await lucia("/assistant/drafts/" + prepared.id + "/confirm", "POST", {
      confirmed: true,
    });
  assert.equal(r1.status, 200);
  assert.equal(r1.data.id, r2.data.id);
});
test("administración protegida y sesión persistida al volver a entrar", async () => {
  assert.equal(
    (await julio("/admin/users/" + j.id + "/role", "PUT", { role: "operador" }))
      .status,
    403,
  );
  assert.equal(
    (
      await admin("/admin/users/" + a.id + "/role", "PUT", {
        role: "ciudadano",
      })
    ).status,
    400,
  );
  assert.equal(
    (await admin("/admin/users/" + j.id + "/role", "PUT", { role: "operador" }))
      .status,
    200,
  );
  await lucia("/auth/logout", "POST", {});
  assert.equal((await lucia("/me")).data, null);
  assert.equal(
    (
      await lucia("/auth/login", "POST", {
        email: "lucia@test.local",
        password: "ContraseñaSegura2026!",
      })
    ).status,
    200,
  );
  assert.equal((await lucia("/me")).data.prefs.theme, "dark");
  assert.equal(one("SELECT COUNT(*) n FROM reports").n, 2);
});
test("validación servidor y protección de origen", async () => {
  assert.equal(
    (await lucia("/reports", "POST", { ...draft, lat: 40, confirmed: true }))
      .status,
    400,
  );
  assert.equal(
    (await lucia("/preferences", "PUT", { fontSize: 900 })).status,
    400,
  );
  const r = await fetch(base + "/api/auth/logout", {
    method: "POST",
    headers: {
      Origin: "https://evil.example",
      "X-Requested-With": "CiudadEscucha",
    },
  });
  assert.equal(r.status, 403);
});
test("foto real se reencodifica, persiste y rechaza formato ajeno", async () => {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#13676b" },
  })
    .png()
    .toBuffer();
  const r = await lucia("/uploads", "POST", {
    image: "data:image/png;base64," + buffer.toString("base64"),
  });
  assert.equal(r.status, 200);
  assert.match(r.data.url, /\.webp$/);
  const image = await fetch(base + r.data.url);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/webp");
  assert.equal(
    (
      await lucia("/uploads", "POST", {
        image: "data:text/html;base64,PGgxPm5vPC9oMT4=",
      })
    ).status,
    400,
  );
});
test("avatar propio: imagen persistente, aislamiento, privacidad y retirada", async () => {
  const sharp=(await import("sharp")).default;
  const png=await sharp({create:{width:60,height:30,channels:3,background:"#08776e"}}).png().toBuffer();
  const body={image:"data:image/png;base64,"+png.toString("base64"),user_id:j.id};
  assert.equal((await anonymous("/me/avatar","PUT",body)).status,401);
  const r=await lucia("/me/avatar","PUT",body);
  assert.equal(r.status,200);assert.match(r.data.avatar,/^\/uploads\/.*\.webp$/);
  assert.equal((await julio("/me")).data.avatar,null);
  const metadata=await sharp(Buffer.from(await (await fetch(base+r.data.avatar)).arrayBuffer())).metadata();
  assert.equal(metadata.width,512);assert.equal(metadata.height,512);assert.equal(metadata.exif,undefined);
  assert.equal((await lucia("/me")).data.avatar,r.data.avatar);
  await lucia("/preferences","PUT",{publicProfile:false});
  assert.equal((await julio("/users/"+l.id)).data.avatar,null);
  assert.equal((await lucia("/me/avatar","PUT",{image:"data:image/png;base64,bm90YW5pbWFnZQ=="})).status,400);
  assert.equal((await lucia("/me")).data.avatar,r.data.avatar);
  assert.equal((await lucia("/me/avatar","PUT",{image:null})).data.avatar,null);
});
test("IA: contexto, borrador validado y confirmación persistente sin duplicación (proveedor simulado)",async()=>{
 const original=globalThis.fetch;process.env.LLM_PROVIDER="groq";process.env.LLM_API_KEY="test-key";
 let captured;
 try{
 globalThis.fetch=async(url,options)=>{if(String(url).startsWith("https://api.groq.com/")){captured=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({reply:"Listo",intent:"draft",title:"Luminaria apagada en parque",description:"La luminaria del parque no enciende por las noches.",category:"Alumbrado público",district:"Los Olivos",address:"Parque central, entrada norte",urgency:"Media"})}}]})};}return original(url,options);};
 const r=await lucia("/assistant/message","POST",{message:"En el parque central, entrada norte",draft:{title:"Luz",description:"Apagada"},consent:true,mode:"voice",conversation:[{role:"user",text:"Quiero reportar una luz apagada en Los Olivos"}]});
 assert.equal(r.status,200);assert.equal(r.data.ready,true);assert.equal(r.data.draft.district,"Los Olivos");assert.match(captured.messages[1].content,/parque central/);
 const staged=await lucia("/assistant/drafts","POST",r.data.draft);assert.equal(staged.status,200);
 const before=one("SELECT COUNT(*) n FROM reports").n;
 const first=await lucia("/assistant/drafts/"+staged.data.id+"/confirm","POST",{confirmed:true});
 const second=await lucia("/assistant/drafts/"+staged.data.id+"/confirm","POST",{confirmed:true});
 assert.equal(first.status,200);assert.equal(first.data.id,second.data.id);assert.equal(one("SELECT COUNT(*) n FROM reports").n,before+1);
 }finally{globalThis.fetch=original;process.env.LLM_PROVIDER="none";delete process.env.LLM_API_KEY;}
});
test("mascotas: OpenAI y Gemini aislados por usuario y sin secretos en configuración",async()=>{
 const original=globalThis.fetch;process.env.OPENAI_API_KEY="test-openai-secret";process.env.GEMINI_API_KEY="test-gemini-secret";const requests=[];
 try{
 globalThis.fetch=async(url,options)=>{if(String(url).startsWith("https://api.openai.com/")||String(url).startsWith("https://generativelanguage.googleapis.com/")){requests.push({url:String(url),body:JSON.parse(options.body),auth:options.headers.Authorization});return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({reply:"Estoy contigo. ¿Qué ocurrió?",intent:"help"})}}]})};}return original(url,options);};
 await lucia("/preferences","PUT",{mascotId:"rabbit1",emotion:"Frustración"});await julio("/preferences","PUT",{mascotId:"rabbit2"});
 assert.equal((await lucia("/assistant/message","POST",{message:"Ayuda",consent:true})).status,200);
 assert.equal((await julio("/assistant/message","POST",{message:"Ayuda",consent:true})).status,200);
 assert.match(requests[0].url,/api.openai.com/);assert.equal(requests[0].auth,"Bearer test-openai-secret");assert.match(requests[0].body.messages[1].content,/Frustración/);
 assert.match(requests[1].url,/generativelanguage.googleapis.com/);assert.equal(requests[1].auth,"Bearer test-gemini-secret");
 assert.equal((await lucia("/me")).data.prefs.mascotId,"rabbit1");assert.equal((await julio("/me")).data.prefs.mascotId,"rabbit2");
 const cfg=(await lucia("/config")).data;assert.equal(cfg.mascots.length,2);assert.ok(cfg.mascots.every(m=>m.available));assert.ok(!JSON.stringify(cfg).includes("secret"));
 }finally{globalThis.fetch=original;delete process.env.OPENAI_API_KEY;delete process.env.GEMINI_API_KEY;}
});
test("personalización continua: aprendizaje privado, adaptación, desactivación y borrado",async()=>{
 await lucia("/preferences","PUT",{adaptive:true,rate:1,voicePause:5});await lucia("/me/usage","POST",{event:"voiceError"});const r=await lucia("/me/usage","POST",{event:"voiceError",user_id:j.id});
 assert.equal(r.data.prefs.voicePause,8);assert.equal(r.data.prefs.rate,0.85);assert.equal(r.data.learning.voiceError,2);assert.equal((await julio("/me")).data.learning.voiceError,undefined);
 assert.equal((await julio("/users/"+l.id)).data.learning,undefined);
 await lucia("/preferences","PUT",{...r.data.prefs,adaptive:false});await lucia("/me/usage","POST",{event:"voiceError"});assert.equal((await lucia("/me")).data.learning.voiceError,2);
 await lucia("/me/usage","DELETE");assert.deepEqual((await lucia("/me")).data.learning,{});
});
after(async () => {
  await new Promise((r) => server.close(r));
  db.close();
});
