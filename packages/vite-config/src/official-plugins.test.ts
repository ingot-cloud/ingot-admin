import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  KNOWN_OFFICIAL_PLUGINS,
  createOfficialSourcePlugin,
  resolveOfficialPlugins,
} from "./official-plugins";
import type { InResolvedOfficialPlugin } from "./official-plugins";

const createdDirs: string[] = [];

const makeTempWorkspace = (): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-official-plugins-"));
  createdDirs.push(root);
  fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - plugins/*\n");
  fs.mkdirSync(path.join(root, "apps"));
  fs.mkdirSync(path.join(root, "plugins"));
  return root;
};

const writePackage = (
  dir: string,
  pkg: Record<string, unknown>,
  files: Record<string, string> = {},
): void => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(dir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
};

const callResolveId = (
  plugin: ReturnType<typeof createOfficialSourcePlugin>,
  id: string,
  importer?: string,
): string | undefined => {
  const resolveId = plugin.resolveId;
  if (typeof resolveId !== "function") {
    throw new Error("expected resolveId function");
  }
  const result = resolveId.call({}, id, importer);
  if (result === null || result === undefined || typeof result === "string") {
    return result ?? undefined;
  }
  if (typeof result === "object" && "id" in result) {
    return result.id;
  }
  return undefined;
};

const callConfig = (plugin: ReturnType<typeof createOfficialSourcePlugin>) => {
  const config = plugin.config;
  if (typeof config !== "function") {
    throw new Error("expected config function");
  }
  return config.call({});
};

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("KNOWN_OFFICIAL_PLUGINS", () => {
  it("包含四个官方业务插件", () => {
    expect(KNOWN_OFFICIAL_PLUGINS).toEqual([
      "@ingot/platform-plugin",
      "@ingot/security-plugin",
      "@ingot/org-plugin",
      "@ingot/member-plugin",
    ]);
  });
});

describe("resolveOfficialPlugins", () => {
  it("当前包自身是官方插件时解析到本包源码根", () => {
    const workspace = makeTempWorkspace();
    const platformDir = path.join(workspace, "plugins/platform");
    writePackage(
      platformDir,
      { name: "@ingot/platform-plugin", dependencies: { "@ingot/admin-core": "workspace:*" } },
      { "src/plugin.ts": "export const platformPlugin = {};\n" },
    );

    const resolved = resolveOfficialPlugins(platformDir);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.packageName).toBe("@ingot/platform-plugin");
    expect(resolved[0]?.rootDir).toBe(platformDir);
    expect(resolved[0]?.srcDir).toBe(path.join(platformDir, "src"));
    expect(resolved[0]?.sourceAliases).toEqual([]);
  });

  it("从 plugins/* 按 package.json name 发现官方插件", () => {
    const workspace = makeTempWorkspace();
    const orgDir = path.join(workspace, "plugins/org");
    const hostDir = path.join(workspace, "apps/admin");
    writePackage(orgDir, { name: "@ingot/org-plugin" }, { "src/plugin.ts": "export {};\n" });
    writePackage(hostDir, {
      name: "@ingot/admin-app",
      dependencies: { "@ingot/org-plugin": "workspace:*" },
    });

    const resolved = resolveOfficialPlugins(hostDir);
    expect(resolved.map((plugin) => plugin.packageName)).toEqual(["@ingot/org-plugin"]);
    expect(resolved[0]?.rootDir).toBe(orgDir);
  });

  it("可通过 node_modules 的 package exports 解析官方插件", () => {
    const workspace = makeTempWorkspace();
    const orgDir = path.join(workspace, "plugins/org");
    const hostDir = path.join(workspace, "apps/admin");
    writePackage(
      orgDir,
      {
        name: "@ingot/org-plugin",
        exports: { ".": { types: "./src/plugin.ts", import: "./src/plugin.ts" } },
      },
      { "src/plugin.ts": "export const orgPlugin = {};\n" },
    );
    writePackage(hostDir, {
      name: "@ingot/admin-app",
      dependencies: { "@ingot/org-plugin": "workspace:*" },
    });
    const nmDir = path.join(hostDir, "node_modules/@ingot");
    fs.mkdirSync(nmDir, { recursive: true });
    fs.symlinkSync(orgDir, path.join(nmDir, "org-plugin"));

    const resolved = resolveOfficialPlugins(hostDir);
    expect(resolved[0]?.rootDir).toBe(fs.realpathSync(path.join(nmDir, "org-plugin")));
  });

  it("宿主只解析直接依赖的官方插件，不会带上未选择的插件", () => {
    const workspace = makeTempWorkspace();
    const orgDir = path.join(workspace, "plugins/org");
    const platformDir = path.join(workspace, "plugins/platform");
    const hostDir = path.join(workspace, "apps/host");

    writePackage(
      orgDir,
      { name: "@ingot/org-plugin" },
      { "src/plugin.ts": "export const orgPlugin = {};\n" },
    );
    writePackage(
      platformDir,
      { name: "@ingot/platform-plugin" },
      { "src/plugin.ts": "export const platformPlugin = {};\n" },
    );
    writePackage(hostDir, {
      name: "demo-host",
      dependencies: { "@ingot/org-plugin": "workspace:*" },
    });

    const resolved = resolveOfficialPlugins(hostDir);
    expect(resolved.map((plugin) => plugin.packageName)).toEqual(["@ingot/org-plugin"]);
  });

  it("admin-app 不再作为官方插件清单项，也不再提供 @base", () => {
    const workspace = makeTempWorkspace();
    const adminDir = path.join(workspace, "apps/admin");
    const securityDir = path.join(workspace, "plugins/security");
    writePackage(
      adminDir,
      { name: "@ingot/admin-app" },
      { "src/plugin.ts": "export const adminHostPlugin = {};\n" },
    );
    writePackage(
      securityDir,
      { name: "@ingot/security-plugin" },
      { "src/plugin.ts": "export const securityPlugin = {};\n" },
    );

    expect(resolveOfficialPlugins(adminDir)).toEqual([]);
    expect(resolveOfficialPlugins(securityDir)[0]?.sourceAliases).toEqual([]);
  });
});

describe("createOfficialSourcePlugin", () => {
  const platformPlugin = (workspace: string): InResolvedOfficialPlugin => {
    const rootDir = path.join(workspace, "plugins/platform");
    writePackage(
      rootDir,
      { name: "@ingot/platform-plugin" },
      {
        "src/plugin.ts": "export const platformPlugin = {};\n",
        "src/models/foo.ts": "export const foo = 1;\n",
      },
    );
    return {
      packageName: "@ingot/platform-plugin",
      rootDir,
      srcDir: path.join(rootDir, "src"),
      sourceAliases: [],
    };
  };

  it("importer 属于官方插件时把 @/ 指回该插件的 src", () => {
    const workspace = makeTempWorkspace();
    const plugin = platformPlugin(workspace);
    const vitePlugin = createOfficialSourcePlugin([plugin], path.join(workspace, "apps/host"));
    const importer = path.join(plugin.srcDir, "plugin.ts");

    expect(callResolveId(vitePlugin, "@/models/foo", importer)).toBe(
      path.join(plugin.srcDir, "models/foo.ts"),
    );
  });

  it("宿主 importer 的 @/ 落回宿主 src", () => {
    const workspace = makeTempWorkspace();
    const plugin = platformPlugin(workspace);
    const hostDir = path.join(workspace, "apps/host");
    const hostSrc = path.join(hostDir, "src");
    writePackage(
      hostDir,
      { name: "demo-host" },
      { "src/main.ts": "export {};\n", "src/models/foo.ts": "export const foo = 1;\n" },
    );
    const vitePlugin = createOfficialSourcePlugin([plugin], hostDir, hostSrc);

    expect(callResolveId(vitePlugin, "@/models/foo", path.join(hostSrc, "main.ts"))).toBe(
      path.join(hostSrc, "models/foo.ts"),
    );
  });

  it("新业务插件不解析 @base", () => {
    const workspace = makeTempWorkspace();
    const plugin = platformPlugin(workspace);
    const vitePlugin = createOfficialSourcePlugin([plugin], path.join(workspace, "apps/host"));
    const importer = path.join(plugin.srcDir, "plugin.ts");

    expect(callResolveId(vitePlugin, "@base/models", importer)).toBeUndefined();
  });

  it("config 去重 Vue 运行时，并只放行已选择插件", () => {
    const workspace = makeTempWorkspace();
    const plugin = platformPlugin(workspace);
    const hostDir = path.join(workspace, "apps/host");
    writePackage(hostDir, { name: "demo-host" });
    const vitePlugin = createOfficialSourcePlugin([plugin], hostDir);
    const config = callConfig(vitePlugin) as {
      resolve?: { dedupe?: string[] };
      optimizeDeps?: { exclude?: string[] };
      server?: { fs?: { allow?: string[] } };
    };

    expect(config.resolve?.dedupe).toEqual(
      expect.arrayContaining(["vue", "vue-router", "pinia", "element-plus", "@vueuse/core"]),
    );
    expect(config.optimizeDeps?.exclude).toEqual(["@ingot/platform-plugin", "@ingot/admin-core"]);
    expect(config.server?.fs?.allow).toEqual(expect.arrayContaining([plugin.rootDir, hostDir]));
    expect(config.optimizeDeps?.exclude).not.toContain("@ingot/org-plugin");
  });
});
