import { test, expect } from "@playwright/test";
test("registro, recorrido, perfiles, comunidad, roles y texto grande", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/registro");
  await page.getByLabel("Nombre o alias").fill("Vecino de prueba");
  await page
    .getByLabel("Correo electrónico")
    .fill("prueba-" + Date.now() + "@demo.local");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("CuentaPrueba2026!");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL(/bienvenida/);
  await page.getByRole("button", { name: "Conocer la aplicación" }).click();
  await expect(
    page.getByRole("complementary", { name: "Recorrido guiado" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Omitir y no volver a mostrar" })
    .click();
  for (const [path, title] of [
    ["/perfil", "Vecino de prueba"],
    ["/comunidad", "La comunidad se mueve"],
    ["/mis-reportes", "Mis reportes"],
    ["/notificaciones", "Tus notificaciones"],
    ["/ajustes", "Accesibilidad y preferencias"],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.goto("/comunidad");
  await page.locator(".neighbor").filter({ hasText: "Julio" }).click();
  await expect(
    page.getByRole("heading", { name: "Julio", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Seguir vecino", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Dejar de seguir", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Solicitar amistad" }).click();
  await expect(
    page.getByRole("button", { name: "Cancelar solicitud" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/capturas/06-perfil-vecino.png",
    fullPage: true,
  });
  await page.goto("/operador");
  await expect(
    page.getByRole("heading", { name: "Acceso restringido" }),
  ).toBeVisible();
  await page.goto("/ajustes");
  await page.getByLabel("Tamaño del texto").fill("180");
  await page.getByLabel("Alto contraste", { exact: true }).check();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Guardar preferencias", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "docs/capturas/07-texto-grande.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
