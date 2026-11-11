import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3000",
    headless: true,
    channel: "msedge",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["json", { outputFile: "docs/pruebas-e2e.json" }]],
});
