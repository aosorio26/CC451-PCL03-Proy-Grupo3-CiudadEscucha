import { db, dataDir } from "../server/db.js";
import { mkdirSync, cpSync } from "node:fs";
import path from "node:path";
const destination = path.resolve(
  process.argv[2] || "backups/" + new Date().toISOString().replaceAll(":", "-"),
);
if (destination.startsWith(dataDir + path.sep))
  throw new Error("La copia debe estar fuera del directorio de datos.");
mkdirSync(destination, { recursive: true });
const target = path.join(destination, "ciudad.sqlite");
db.exec("VACUUM INTO '" + target.replaceAll("'", "''") + "'");
try {
  cpSync(path.join(dataDir, "uploads"), path.join(destination, "uploads"), {
    recursive: true,
  });
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
console.log(
  "Copia de base y fotografías creada. Mantén la copia fuera del repositorio.",
);
