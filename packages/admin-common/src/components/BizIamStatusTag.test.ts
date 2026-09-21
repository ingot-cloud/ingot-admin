import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "BizIamStatusTag.vue"), "utf8");

describe("BizIamStatusTag", () => {
  it("使用框架 status-tag，不再走 InTag", () => {
    expect(source).toContain("<status-tag");
    expect(source).toContain(':tone="tone"');
    expect(source).toContain(':label="label"');
    expect(source).toContain('return "info"');
    expect(source).toContain('return "warning"');
    expect(source).not.toContain("in-tag");
    expect(source).not.toContain("InTag");
  });
});
