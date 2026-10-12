import { defineConfig, devices } from "@playwright/test";
import process from "node:process";
/** 在两管理台生产预览上验证同批新入口，API 全部由夹具隔离。 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["authorization-audit.spec.ts", "platform-capability-completion.spec.ts"],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 2,
  reporter: "list",
  outputDir: "test-results/capabilities",
  use: {
    headless: true,
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  projects: [
    {
      name: "platform",
      grepInvert: /租户专属/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5811" },
    },
    {
      name: "tenant",
      grepInvert: /平台专属/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5812" },
    },
  ],
  webServer: [
    {
      command: "pnpm exec vite preview --host 127.0.0.1 --port 5811 --strictPort",
      port: 5811,
      reuseExistingServer: false,
    },
    {
      command: "pnpm --dir ../admin exec vite preview --host 127.0.0.1 --port 5812 --strictPort",
      port: 5812,
      reuseExistingServer: false,
    },
  ],
});
