import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "AppPreviewPanel.vue"),
  "utf8",
);

describe("application create preview", () => {
  it("菜单按树缩进展示，并与资源预览同一块灰底", () => {
    expect(source).toContain("menusToTree");
    expect(source).toContain("flattenPreview");
    expect(source).toContain("paddingLeft");
    expect(source).toContain("bg-[#f8f9fa]");
    expect(source).toContain(':framed="false"');
  });
});
