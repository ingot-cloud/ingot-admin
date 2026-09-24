import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "ActionHierarchy.vue"),
  "utf8",
);

describe("platform iam application ActionHierarchy", () => {
  it("已选清除按钮右对齐", () => {
    expect(source).toContain("grid-template-columns: auto minmax(0, 1fr) auto");
    expect(source).toContain('class="action-remove"');
    expect(source).toContain("in-close-button");
  });
});
