import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

// 先运行 pnpm build:shared；CI 可使用 Playwright 自带 Chromium。
const source = await readFile(new URL("../packages/shared/dist/time.js", import.meta.url), "utf8");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
try {
  const cases = [
    ["UTC", "2026-10-08 01:00:00", "2026-10-08T09:00:00.000Z"],
    ["Asia/Shanghai", "2026-10-08 09:00:00", "2026-10-08T01:00:00.000Z"],
    ["America/New_York", "2026-10-07 21:00:00", "2026-10-08T13:00:00.000Z"],
  ];
  for (const [zone, display, submitted] of cases) {
    const context = await browser.newContext({ timezoneId: zone });
    try {
      const page = await context.newPage();
      await page.addScriptTag({
        type: "module",
        content: `${source}\nwindow.timeContract = { formatDateTime, parseInstantDate, toApiInstant, browserTimeZone };`,
      });
      await page.waitForFunction(() => !!window.timeContract);
      const result = await page.evaluate(() => {
        const { formatDateTime, parseInstantDate, toApiInstant, browserTimeZone } =
          window.timeContract;
        const raw = "2026-10-08T01:00:00.123456789Z";
        const selection = parseInstantDate(raw);
        return {
          zone: browserTimeZone(),
          display: formatDateTime(raw),
          fixed: formatDateTime(raw, { timeZone: "Asia/Shanghai" }),
          selected: toApiInstant(new Date(2026, 9, 8, 9, 0, 0)),
          selection: toApiInstant(selection),
          raw,
          invalid: formatDateTime("2026-10-08 09:00:00"),
          beforeDst: formatDateTime("2026-03-08T06:59:59Z", { timeZone: "America/New_York" }),
          afterDst: formatDateTime("2026-03-08T07:00:00Z", { timeZone: "America/New_York" }),
        };
      });
      assert.equal(result.zone, zone);
      assert.equal(result.display, display);
      assert.equal(result.fixed, "2026-10-08 09:00:00");
      assert.equal(result.selected, submitted);
      assert.equal(result.selection, "2026-10-08T01:00:00.123Z");
      assert.equal(result.raw, "2026-10-08T01:00:00.123456789Z");
      assert.equal(result.invalid, "-");
      assert.equal(result.beforeDst, "2026-03-08 01:59:59");
      assert.equal(result.afterDst, "2026-03-08 03:00:00");
      console.log(`${zone}: display, local selection, precision and DST passed`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
