import { defineConfig, devices } from "@playwright/test";
import process from "node:process";
const development = process.env.SECURITY_UI_DEV === "1";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "security-page-interactions.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 2,
  reporter: "list",
  outputDir: "test-results/security-ui",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5813",
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  webServer: {
    command: development
      ? "pnpm exec vite --host 127.0.0.1 --port 5813 --strictPort"
      : "pnpm exec vite preview --host 127.0.0.1 --port 5813 --strictPort",
    port: 5813,
    reuseExistingServer: false,
  },
});
