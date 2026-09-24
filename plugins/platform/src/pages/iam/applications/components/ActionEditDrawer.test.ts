import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "ActionEditDrawer.vue"),
  "utf8",
);

describe("platform iam ActionEditDrawer", () => {
  it("关闭时通知列表对话框重新打开", () => {
    expect(source).toContain("close: []");
    expect(source).toContain('emits("close")');
  });
});
