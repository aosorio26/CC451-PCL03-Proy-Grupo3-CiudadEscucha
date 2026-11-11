import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["rescue-rabbit.png", "rescue-rabbit-2.png", "icon-192.png", "icon-512.png", "ciudad-escucha-logo.png", "parque-ciudad.png"],
      manifest: {
        name: "Ciudad Escucha",
        short_name: "Ciudad Escucha",
        description: "Tu voz mejora tu ciudad",
        lang: "es-PE",
        theme_color: "#075fb8",
        background_color: "#f5f7f5",
        display: "standalone",
        start_url: "/",
        id: "/",
        scope: "/",
        categories: ["social", "utilities"],
        shortcuts: [
          {
            name: "Crear reporte",
            short_name: "Reportar",
            url: "/reportar",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Explorar mi barrio",
            short_name: "Mapa",
            url: "/mapa",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Hablar con Rescue Rabbit",
            short_name: "Asistente",
            url: "/asistente",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
        ],
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:3000",
      "/uploads": "http://127.0.0.1:3000",
    },
  },
  build: { chunkSizeWarningLimit: 800 },
});
