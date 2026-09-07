import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "IndexPage.vue"),
  "utf8",
);

describe("platform develop qrcode IndexPage", () => {
  it("使用 page 模式页面头，且无松散比较", () => {
    expect(source).toContain('mode="page"');
    expect(source).toContain("in-page-header");
    expect(source).toContain('description="生成并下载自定义二维码。"');
    expect(source).toContain("二维码配置");
    expect(source).not.toContain("in-custom-title");
    expect(source).not.toContain("#192f48");
    expect(source.replaceAll("===", "")).not.toContain("==");
  });
});
