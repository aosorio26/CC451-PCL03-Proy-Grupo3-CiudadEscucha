import { districts } from "./domain.js";
const cache = new Map();
let chain = Promise.resolve(),
  next = 0,
  queued = 0;
const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^distrito de /, "")
    .trim();
export function decodeAddress(data) {
  const a = data.address || {};
  const names = [
    a.city_district,
    a.suburb,
    a.municipality,
    a.city,
    a.town,
    a.county,
  ].filter(Boolean);
  let district = Object.keys(districts).find((d) =>
    names.some((n) => norm(n) === norm(d)),
  );
  if (!district && names.some((n) => norm(n) === "santiago de surco"))
    district = "Surco";
  if (!district && ["lima", "cercado de lima"].includes(norm(names[0] || "")))
    district = "Centro de Lima";
  const road = a.road || a.pedestrian || a.footway || a.square;
  const address = road
    ? [road, a.house_number].filter(Boolean).join(" ")
    : data.name || "";
  return {
    address: address.slice(0, 250),
    district: district || null,
    source: "OpenStreetMap",
    attribution: "© OpenStreetMap contributors",
  };
}
export async function reverseGeocode(lat, lng) {
  const key = lat.toFixed(5) + "," + lng.toFixed(5);
  if (cache.has(key)) return cache.get(key);
  if (queued >= 8)
    throw Error(
      "El mapa está ocupado. Vuelve a elegir el punto en unos segundos.",
    );
  queued++;
  const task = chain.then(async () => {
    if (cache.has(key)) return cache.get(key);
    await new Promise((r) => setTimeout(r, Math.max(0, next - Date.now())));
    next = Date.now() + 1100;
    const base =
      process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org/reverse";
    const url = new URL(base);
    url.search = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      zoom: "18",
      addressdetails: "1",
      "accept-language": "es",
    });
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          process.env.GEOCODER_USER_AGENT ||
          "CiudadEscucha/1.0 (interactive map lookup)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok)
      throw Error(
        "No pudimos consultar la dirección. Puedes escribirla manualmente.",
      );
    const data = decodeAddress(await r.json());
    if (cache.size >= 300) cache.delete(cache.keys().next().value);
    cache.set(key, data);
    return data;
  });
  chain = task.catch(() => {});
  try {
    return await task;
  } finally {
    queued--;
  }
}
