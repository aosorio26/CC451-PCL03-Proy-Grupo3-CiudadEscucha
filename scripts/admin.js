import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { one, run } from "../server/db.js";
import { hashPassword } from "../server/auth.js";
const input = createInterface({ input: process.stdin, output: process.stdout });
console.log(
  "Administración local del servidor. La contraseña no se solicita aquí; la cuenta debe registrarse desde la app.",
);
const email = (await input.question("Correo de la cuenta a promover: "))
  .trim()
  .toLowerCase();
const user = one("SELECT id,name FROM users WHERE email=?", email);
if (!user) {
  input.close();
  throw new Error("No existe esa cuenta. Regístrala primero.");
}
const confirm = await input.question(
  `Escribe ADMIN para asignar permisos a ${user.name}: `,
);
input.close();
if (confirm !== "ADMIN") throw new Error("Sin cambios.");
run("UPDATE users SET role='administrador' WHERE id=?", user.id);
console.log("Rol actualizado. Inicia sesión nuevamente.");
