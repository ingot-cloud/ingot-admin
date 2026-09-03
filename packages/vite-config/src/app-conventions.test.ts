import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectAppConventionViolations } from "./app-conventions";

const createdDirs: string[] = [];

const makeApp = (files: Record<string, string>): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-app-conventions-"));
  createdDirs.push(root);
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
  return root;
};

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("collectAppConventionViolations", () => {
  it("允许 Biz* 组件与自定义 hook", () => {
    const rootDir = makeApp({
      "src/components/BizAppBanner.vue": "<template><div /></template>",
      "src/hooks/useAppFoo.ts": "export const useAppFoo = () => 1;\n",
    });

    expect(collectAppConventionViolations({ rootDir })).toEqual([]);
  });

  it("拒绝 In* 组件与保留 hook/store 导出名", () => {
    const rootDir = makeApp({
      "src/components/InButton.vue": "<template><button /></template>",
      "src/hooks/usePaging.ts": "export const usePaging = () => undefined;\n",
      "src/stores/useAppStore.ts": "export const useAppStore = () => undefined;\n",
    });

    const violations = collectAppConventionViolations({ rootDir });
    expect(violations.some((item) => item.includes("InButton"))).toBe(true);
    expect(violations.some((item) => item.includes("usePaging"))).toBe(true);
    expect(violations.some((item) => item.includes("useAppStore"))).toBe(true);
  });
});
