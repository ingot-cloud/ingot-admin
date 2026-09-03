import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createUnoContentFilesystem, UNO_CONTENT_GLOB } from "./uno-content";

const createdDirs: string[] = [];

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("createUnoContentFilesystem", () => {
  it("始终包含宿主 src，并并入官方插件 src", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-uno-content-"));
    createdDirs.push(root);
    const pluginSrc = path.join(root, "plugins", "platform", "src");

    const globs = createUnoContentFilesystem(root, [
      {
        packageName: "@ingot/platform-plugin",
        rootDir: path.join(root, "plugins", "platform"),
        srcDir: pluginSrc,
        sourceAliases: [],
      },
    ]);

    expect(globs).toContain(path.join(root, "src", UNO_CONTENT_GLOB).replace(/\\/g, "/"));
    expect(globs).toContain(path.join(pluginSrc, UNO_CONTENT_GLOB).replace(/\\/g, "/"));
  });

  it("workspace 存在 admin-core 源码时一并扫描", () => {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-uno-workspace-"));
    createdDirs.push(workspace);
    const appDir = path.join(workspace, "apps", "admin");
    const coreSrc = path.join(workspace, "packages", "admin-core", "src");
    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(coreSrc, { recursive: true });

    const globs = createUnoContentFilesystem(appDir);

    expect(globs).toContain(path.join(coreSrc, UNO_CONTENT_GLOB).replace(/\\/g, "/"));
  });
});
