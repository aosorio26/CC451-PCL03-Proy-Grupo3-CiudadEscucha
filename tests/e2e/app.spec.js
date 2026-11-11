import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page, email) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("CiudadDemo2026!");
  await page.getByRole("button", { name: "Entrar a Ciudad Escucha" }).click();
  await expect(page).not.toHaveURL(/login/);
  if (page.url().includes("bienvenida"))
    await page.getByRole("button", { name: "Explorar por mi cuenta" }).click();
}
test("dos sesiones: reporte, apoyo, comentario, estado, preferencias y persistencia", async ({
  browser,
}) => {
  const c1 = await browser.newContext(),
    c2 = await browser.newContext(),
    c3 = await browser.newContext();
  const lucia = await c1.newPage(),
    julio = await c2.newPage(),
    karina = await c3.newPage();
  await login(lucia, "lucia@demo.local");
  await lucia.goto("/reportar");
  await lucia
    .getByLabel("Título breve")
    .fill("Semáforo de prueba entre dos vecinos");
  await lucia
    .getByLabel("Descripción", { exact: true })
    .fill("El semáforo del cruce está apagado. Evidencia automatizada PC3.");
  await lucia.getByLabel("Tipo de problema").selectOption("Semáforos");
  await lucia.getByRole("button", { name: "Continuar", exact: true }).click();
  await lucia
    .getByLabel("Dirección o referencia pública")
    .fill("Avenida de prueba, cruce peatonal");
  await lucia.getByRole("button", { name: "Continuar", exact: true }).click();
  await lucia.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    lucia.getByRole("button", { name: "Confirmar y publicar" }),
  ).toBeDisabled();
  await lucia.getByLabel("Revisé la información").check();
  await lucia.getByRole("button", { name: "Confirmar y publicar" }).click();
  await expect(lucia).toHaveURL(/incidencias\//);
  const url = lucia.url();
  await login(julio, "julio@demo.local");
  await julio.goto(url);
  await julio.getByRole("button", { name: /^Apoyar/ }).click();
  await expect(
    julio.getByRole("button", { name: /Retirar apoyo · 1/ }),
  ).toBeVisible();
  await julio
    .getByLabel("Aporta al reporte")
    .fill("Julio confirma que también observó el problema.");
  await julio.getByRole("button", { name: "Guardar comentario" }).click();
  await expect(
    julio
      .locator(".comment p")
      .filter({ hasText: "Julio confirma que también observó el problema." }),
  ).toBeVisible();
  await lucia.reload();
  await expect(
    lucia.getByText("Julio confirma que también observó el problema."),
  ).toBeVisible();
  await lucia.screenshot({
    path: "docs/capturas/03-colaboracion.png",
    fullPage: true,
  });
  await login(karina, "karina@demo.local");
  await karina.goto("/operador");
  const row = karina
    .getByRole("row")
    .filter({ hasText: "Semáforo de prueba entre dos vecinos" })
    .first();
  await row.getByRole("button", { name: "Gestionar" }).click();
  await karina
    .getByRole("combobox", { name: "Estado", exact: true })
    .last()
    .selectOption("En atención");
  await karina
    .getByLabel("Nota del cambio")
    .fill("Revisión del equipo de demostración PC3.");
  karina.once("dialog", (d) => d.accept());
  await karina
    .getByRole("button", { name: "Revisar y confirmar cambio" })
    .click();
  await expect(
    karina.getByText("Estado actualizado y notificaciones enviadas."),
  ).toBeVisible();
  await julio.reload();
  await expect(
    julio.getByText("En atención", { exact: true }).first(),
  ).toBeVisible();
  await lucia.goto("/ajustes");
  await lucia.getByLabel("Apariencia").selectOption("dark");
  await lucia
    .getByRole("button", { name: "Guardar preferencias", exact: true })
    .click();
  await expect(
    lucia.getByText("Preferencias guardadas en tu cuenta."),
  ).toBeVisible();
  await lucia.reload();
  await expect(lucia.locator("html")).toHaveAttribute("data-theme", "dark");
  await lucia.screenshot({
    path: "docs/capturas/04-accesibilidad-oscuro.png",
    fullPage: true,
  });
  await lucia.getByLabel("Apariencia").selectOption("light");
  await lucia
    .getByRole("button", { name: "Guardar preferencias", exact: true })
    .click();
  await c1.close();
  await c2.close();
  await c3.close();
});
test("inicio, mapa calor, móvil, manifest y accesibilidad", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Te escuchamos/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/capturas/01-inicio-desktop.png",
    fullPage: true,
  });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  await test.info().attach("axe-home", {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  });
  expect(results.violations).toEqual([]);
  await page.goto("/mapa");
  await page
    .getByRole("button", { name: "Mapa de calor", exact: true })
    .click();
  await expect(page.locator(".leaflet-heatmap-layer")).toBeVisible();
  await page.screenshot({
    path: "docs/capturas/02-mapa-calor.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "docs/capturas/05-inicio-movil.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).display).toBe("standalone");
  await expect
    .poll(() =>
      page.evaluate(
        async () => !!(await navigator.serviceWorker.getRegistration()),
      ),
    )
    .toBeTruthy();
});
test("asistente no disponible y borrador manual offline", async ({page,context})=>{
 await login(page,"julio@demo.local");await page.goto("/asistente");await expect(page.getByText(/El asistente no está disponible/)).toBeVisible();await page.getByRole("link",{name:"crear tu reporte con el formulario"}).click();await context.setOffline(true);await page.getByLabel("Título breve").fill("Luminaria sin funcionar");await page.getByLabel("Descripción",{exact:true}).fill("Borrador que se conserva sin conexión a Internet.");await expect(page.getByText(/Sin conexión. Puedes preparar/)).toBeVisible();expect(await page.evaluate(()=>Object.entries(localStorage).some(([k,v])=>k.startsWith("ce-draft-")&&v.includes("Borrador que se conserva")))).toBeTruthy();await context.setOffline(false);
});
