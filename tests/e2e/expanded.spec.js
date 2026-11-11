import { test, expect } from "@playwright/test";
async function login(page, email) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("CiudadDemo2026!");
  await page.getByRole("button", { name: "Entrar a Ciudad Escucha" }).click();
  await expect(page).not.toHaveURL(/login/);
}
test("operador entra a gestión y el perfil muestra niveles y amigos", async ({
  page,
}) => {
  await login(page, "karina@demo.local");
  await expect(page).toHaveURL(/operador/);
  await expect(
    page.getByRole("heading", { name: "Tu centro de operaciones" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Navegación móvil" })
      .getByRole("link", { name: "Gestión" }),
  ).toBeVisible();
  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "Mis amigos" })).toBeVisible();
  await expect(page.getByText(/Te faltan .* puntos para/)).toBeVisible();
});
test("edición rápida manual permite corregir y publicar", async ({ page }) => {
  await login(page, "lucia@demo.local");
  await page.goto("/rapido");
  await page
    .getByLabel("Descripción para la IA")
    .fill("La luz del parque no funciona desde ayer");
  await page
    .getByRole("button", { name: "Abrir edición rápida manual" })
    .click();
  await page.getByLabel("Título breve").fill("Luz del parque corregida");
  await page
    .getByLabel("Dirección o referencia pública")
    .fill("Parque central de Los Olivos");
  await page.getByLabel("Revisé la información").check();
  await page.getByRole("button", { name: "Confirmar y publicar" }).click();
  await expect(page).toHaveURL(/incidencias\//);
  await expect(
    page.getByRole("heading", { name: "Luz del parque corregida" }),
  ).toBeVisible();
});
