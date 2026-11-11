export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch("/api" + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "CiudadEscucha",
        ...options.headers,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal || AbortSignal.timeout(45000),
    });
  } catch {
    throw new Error(
      "No hay conexión con el servidor. Conserva tu borrador y vuelve a intentarlo.",
    );
  }
  const data = await response
    .json()
    .catch(() => ({ error: "No se pudo completar la petición." }));
  if (!response.ok) throw new Error(data.error || "Acción no permitida.");
  return data;
}
export const date = (s) =>
  new Date(s).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  });
export function download(name, value) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
