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
    expect(source).toContain('class="ml-auto shrink-0"');
    expect(source).toContain("in-close-button");
  });
});
