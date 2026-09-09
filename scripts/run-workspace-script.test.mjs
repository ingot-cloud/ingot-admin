import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { matchingWorkspacePackageDirs } from "./run-workspace-script.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("真实仓库空 themes 时匹配不到主题包", () => {
  const dirs = matchingWorkspacePackageDirs(repoRoot, "./themes/*");
  assert.deepEqual(dirs, []);
});

test("临时目录无 package.json 的 themes 子目录不算主题包", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-themes-filter-"));
  try {
    fs.mkdirSync(path.join(rootDir, "themes", "notes"), { recursive: true });
    fs.writeFileSync(path.join(rootDir, "themes", "notes", "README.md"), "not a package\n");
    assert.deepEqual(matchingWorkspacePackageDirs(rootDir, "./themes/*"), []);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("存在 package.json 的 themes 子目录会被发现", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-themes-filter-"));
  try {
    const themeDir = path.join(rootDir, "themes", "aurora");
    fs.mkdirSync(themeDir, { recursive: true });
    fs.writeFileSync(
      path.join(themeDir, "package.json"),
      `${JSON.stringify({ name: "@ingot/theme-aurora", private: true }, null, 2)}\n`,
    );
    assert.deepEqual(matchingWorkspacePackageDirs(rootDir, "./themes/*"), [themeDir]);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});
