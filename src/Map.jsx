import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
window.L = L;
export default function CityMap({
  reports = [],
  mode = "Marcadores",
  onPick,
  point,
  height = 440,
}) {
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const [tileState, setTileState] = useState("loading");
  const host = useRef(),
    map = useRef(),
    layers = useRef();
  useEffect(() => {
    const m = L.map(host.current, { scrollWheelZoom: false }).setView(
      point || [-12.045, -77.045],
      11,
    );
    map.current = m;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    ).addTo(m);
    let loaded = false;
    tiles.on("tileload", () => {
      loaded = true;
      setTileState("ready");
    });
    tiles.on("tileerror", () => {
      if (!loaded) setTileState("error");
    });
    const tileTimeout = setTimeout(() => {
      if (!loaded) setTileState("error");
    }, 8000);
    if (onPick)
      m.on("click", (e) =>
        pickRef.current?.([
          Number(e.latlng.lat.toFixed(6)),
          Number(e.latlng.lng.toFixed(6)),
        ]),
      );
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(host.current);
    return () => {
      clearTimeout(tileTimeout);
      resize.disconnect();
      m.remove();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const m = map.current;
    if (!m) return;
    if (layers.current) m.removeLayer(layers.current);
    const group = L.layerGroup().addTo(m);
    layers.current = group;
    if (point) {
      L.circleMarker(point, {
        radius: 10,
        color: "#0c7478",
        fillOpacity: 1,
      }).addTo(group);
      m.setView(point, 14);
    }
    if (mode === "Mapa de calor") {
      import("leaflet.heat").then(() => {
        if (!cancelled)
          L.heatLayer(
            reports.map((r) => [r.lat, r.lng, 1]),
            { radius: 28, blur: 22, maxZoom: 14, minOpacity: 0.35 },
          ).addTo(group);
      });
    } else {
      const cluster =
        mode === "Marcadores"
          ? L.markerClusterGroup({ showCoverageOnHover: false })
          : group;
      if (cluster !== group) group.addLayer(cluster);
      reports.forEach((r) => {
        const marker =
          mode === "Burbujas"
            ? L.circleMarker([r.lat, r.lng], {
                radius: 8 + Math.sqrt(r.supports) * 4,
                color: r.status === "Resuelto" ? "#338368" : "#117b82",
                fillOpacity: 0.6,
              })
            : L.marker([r.lat, r.lng], {
                icon: L.divIcon({
                  className: "map-pin",
                  html: "<span></span>",
                  iconSize: [22, 28],
                  iconAnchor: [11, 28],
                }),
              });
        const box = document.createElement("div"),
          title = document.createElement("strong"),
          link = document.createElement("a");
        title.textContent = r.title;
        link.textContent = "Ver incidencia →";
        link.href = "/incidencias/" + r.id;
        box.append(title, document.createElement("br"), link);
        marker.bindPopup(box).addTo(cluster);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [reports, mode, point?.[0], point?.[1]]);
  return (
    <>
      {tileState !== "ready" && (
        <p className="map-caption" role="status">
          {tileState === "loading"
            ? "Cargando cartografía de OpenStreetMap… La lista ya está disponible."
            : "La cartografía externa no respondió. Los puntos siguen representando tus reportes; usa la lista o la referencia manual para continuar."}
        </p>
      )}
      <div
        className="map"
        ref={host}
        style={{ height }}
        role="region"
        aria-label={
          onPick
            ? "Mapa para seleccionar ubicación. También puedes usar los campos de ubicación."
            : "Mapa de incidencias. Usa Lista accesible para navegación por teclado."
        }
      />
    </>
  );
}
