import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { reportSchema } from "../server/domain.js";
import { one, run, transaction } from "../server/db.js";
const file = process.argv[2],
  email = process.argv[3],
  commit = process.argv.includes("--commit");
if (!file || !email)
  throw new Error(
    "Uso: node --env-file-if-exists=.env scripts/import-reports.js archivo.json correo-autorizado [--commit]",
  );
const user = one("SELECT * FROM users WHERE email=?", email.toLowerCase());
if (!user) throw new Error("Crea primero la cuenta responsable.");
const raw = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(raw) || raw.length > 10000)
  throw new Error("Se espera un arreglo de máximo 10 000 registros.");
const records = raw.map((r, i) => {
  const parsed = reportSchema.safeParse(r);
  if (!parsed.success)
    throw new Error(`Registro ${i + 1}: ${parsed.error.message}`);
  return { ...parsed.data, id: randomUUID() };
});
console.log(
  `${records.length} registros válidos. ${commit ? "Importando…" : "Simulación: nada escrito. Añade --commit para importar."}`,
);
if (commit)
  transaction(() => {
    for (const d of records) {
      const date = new Date().toISOString();
      run(
        "INSERT INTO reports(id,user_id,title,description,category,district,address,lat,lng,urgency,photo,photo_alt,created,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        d.id,
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
        date,
        d.request_key || null,
      );
      run(
        "INSERT INTO history(report_id,user_id,status,note,created) VALUES(?,?,?,?,?)",
        d.id,
        user.id,
        "Reportado",
        "Importado desde un conjunto revisado por el responsable",
        date,
      );
    }
  });
