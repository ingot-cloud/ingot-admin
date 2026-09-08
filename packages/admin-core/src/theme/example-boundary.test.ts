import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const exampleRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../examples/admin-theme",
);

const collect = (dir: string): string[] => {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "dist" || entry === "node_modules") {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collect(full));
      continue;
    }
    if ([".ts", ".vue", ".css", ".json"].includes(extname(full))) {
      results.push(full);
    }
  }
  return results;
};

describe("example admin theme package", () => {
  const files = collect(join(exampleRoot, "src"));
  const pkg = JSON.parse(readFileSync(join(exampleRoot, "package.json"), "utf8")) as {
    sideEffects: string[];
    peerDependencies: Record<string, string>;
    exports: Record<string, unknown>;
  };

  it("只依赖公开接口，不扫描源码或私有路径", () => {
    const sources = files.filter((file) => file.endsWith(".ts") || file.endsWith(".vue"));
    for (const file of sources) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/from\s+["']@\//);
      expect(source, file).not.toMatch(/@ingot\/admin-core\/src/);
      expect(source, file).not.toMatch(/layouts\/main\/IndexPage/);
    }
  });

  it("声明 CSS sideEffects 与 Vue / admin-core peerDependencies", () => {
    expect(pkg.peerDependencies.vue).toBeTruthy();
    expect(pkg.peerDependencies["@ingot/admin-core"]).toBeTruthy();
    expect(pkg.sideEffects.some((item) => item.includes(".css"))).toBe(true);
    expect(pkg.exports["./style.css"]).toBeTruthy();
  });

  it("附加 CSS 使用主题作用域且不回写公共 Token", () => {
    const css = readFileSync(join(exampleRoot, "src/style.css"), "utf8");
    expect(css).toContain('html[data-in-theme="example-horizon"]');
    expect(css).toContain('html.dark[data-in-theme="example-horizon"]');
    expect(css).not.toMatch(/--in-[a-z-]+:/);
    expect(css).not.toMatch(/--el-/);
  });
});
