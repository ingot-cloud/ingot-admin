import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { IconifyJSON } from "@iconify/types";
import {
  buildOfflineIconData,
  collectIconNamesFromFiles,
  filterIconsByPrefixes,
  generateIconModule,
  generateOfflineModule,
  listDeclaredIconifyPrefixes,
  listSourceFiles,
  parseIconNameList,
  parseQuotedIconNames,
} from "./iconify-offline";
import { usedFileToCollections, usedIconNames } from "./iconify-used";

const createdDirs: string[] = [];

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

const makeTempDir = (): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ingot-iconify-"));
  createdDirs.push(dir);
  return dir;
};

const writeIconifyJsonPackage = (root: string, prefix: string, json: IconifyJSON): void => {
  const pkgDir = path.join(root, "node_modules", "@iconify-json", prefix);
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(
    path.join(pkgDir, "package.json"),
    JSON.stringify({ name: `@iconify-json/${prefix}`, type: "module" }),
  );
  fs.writeFileSync(path.join(pkgDir, "icons.json"), JSON.stringify(json));
};

describe("parseQuotedIconNames", () => {
  it("收集引号中的 prefix:name，忽略 URL", () => {
    const source = `
      <in-icon name="bi:fullscreen" />
      icon: 'ep:user'
      const extra = \`mdi:home\`
      href="https://example.com"
    `;
    expect(parseQuotedIconNames(source)).toEqual([
      { prefix: "bi", name: "fullscreen" },
      { prefix: "ep", name: "user" },
      { prefix: "mdi", name: "home" },
    ]);
  });

  it("支持带数字的 fluent 图标名", () => {
    expect(parseQuotedIconNames(`icon: "fluent:home-more-48-regular"`)).toEqual([
      { prefix: "fluent", name: "home-more-48-regular" },
    ]);
  });
});

describe("parseIconNameList", () => {
  it("解析 extra 配置并忽略非法项", () => {
    expect(parseIconNameList(["ep:menu", " bad ", "bi:fullscreen-exit"])).toEqual([
      { prefix: "ep", name: "menu" },
      { prefix: "bi", name: "fullscreen-exit" },
    ]);
  });
});

describe("listSourceFiles", () => {
  it("扫描源码并跳过测试与 d.ts", () => {
    const root = makeTempDir();
    fs.mkdirSync(path.join(root, "src"), { recursive: true });
    fs.writeFileSync(path.join(root, "src", "Header.vue"), `<in-icon name="ep:user" />`);
    fs.writeFileSync(path.join(root, "src", "Header.test.ts"), `icon: "mdi:only-in-test"`);
    fs.writeFileSync(path.join(root, "src", "env.d.ts"), `declare module "x"`);

    const files = listSourceFiles([path.join(root, "src")]);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("Header.vue");
    expect(collectIconNamesFromFiles(files)).toEqual([{ prefix: "ep", name: "user" }]);
  });
});

describe("listDeclaredIconifyPrefixes", () => {
  it("从 package.json 收集 @iconify-json/*", () => {
    const root = makeTempDir();
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        devDependencies: {
          "@iconify-json/ep": "1.0.0",
          "@iconify-json/bi": "1.0.0",
          vue: "3.0.0",
        },
      }),
    );
    expect(listDeclaredIconifyPrefixes([root])).toEqual(["bi", "ep"]);
  });
});

describe("filterIconsByPrefixes", () => {
  it("丢掉未安装集合，避免把 update:modelValue 当成图标", () => {
    const filtered = filterIconsByPrefixes(
      [
        { prefix: "ep", name: "user" },
        { prefix: "update", name: "modelValue" },
        { prefix: "virtual", name: "iconify-offline" },
        { prefix: "ingot", name: "bell-outlined" },
      ],
      new Set(["ep", "bi"]),
    );
    expect(filtered).toEqual([{ prefix: "ep", name: "user" }]);
  });
});

describe("buildOfflineIconData", () => {
  it("按需抽取图标并保留 extra，缺失集合记入 missingPrefixes", () => {
    const root = makeTempDir();
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "fixture" }));
    writeIconifyJsonPackage(root, "ep", {
      prefix: "ep",
      icons: {
        user: { body: "<path d='M1' />" },
        menu: { body: "<path d='M2' />" },
      },
    });

    const result = buildOfflineIconData({
      scanIcons: [
        { prefix: "ep", name: "user" },
        { prefix: "unknown", name: "x" },
      ],
      extraIcons: [{ prefix: "ep", name: "menu" }],
      fullCollections: [],
      packageDirs: [root],
    });
    expect(result.missingPrefixes).toEqual(["unknown"]);
    expect(result.collections).toHaveLength(1);
    expect(Object.keys(result.collections[0]?.icons ?? {}).sort()).toEqual(["menu", "user"]);
  });

  it("整包 collections 时打入该前缀全部图标", () => {
    const root = makeTempDir();
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "fixture" }));
    writeIconifyJsonPackage(root, "ep", {
      prefix: "ep",
      icons: {
        user: { body: "<path d='M1' />" },
        menu: { body: "<path d='M2' />" },
      },
    });

    const result = buildOfflineIconData({
      scanIcons: [],
      extraIcons: [],
      fullCollections: ["ep"],
      packageDirs: [root],
    });
    expect(Object.keys(result.collections[0]?.icons ?? {}).sort()).toEqual(["menu", "user"]);
  });
});

describe("generateOfflineModule", () => {
  it("生成 offline addCollection 模块", () => {
    const source = generateOfflineModule([
      { prefix: "bi", icons: { fullscreen: { body: "<path d='M0' />" } } },
    ]);
    expect(source).toContain('from "@iconify/vue/offline"');
    expect(source).toContain("addCollection(");
    expect(source).toContain("fullscreen");
  });
});

describe("generateIconModule", () => {
  it("开发导出在线 Icon，生产先导入离线包", () => {
    expect(generateIconModule(false)).toContain('from "@iconify/vue"');
    expect(generateIconModule(false)).not.toContain("virtual:iconify-offline");
    const prod = generateIconModule(true);
    expect(prod).toContain("virtual:iconify-offline");
    expect(prod).toContain("@iconify/vue/offline");
  });
});

describe("used.json 并入离线包", () => {
  it("used 中的图标直接进模块，不必安装对应 @iconify-json", () => {
    const used = {
      mynaui: {
        prefix: "mynaui",
        icons: { config: { body: "<path d='M1' />", width: 24 } },
      },
    };
    const recorded = usedIconNames(used);
    const extraIcons = parseIconNameList(["mynaui:config", "ep:user"]).filter(
      (icon) => !recorded.has(`${icon.prefix}:${icon.name}`),
    );
    expect(extraIcons).toEqual([{ prefix: "ep", name: "user" }]);

    const source = generateOfflineModule([
      ...usedFileToCollections(used),
      { prefix: "ep", icons: { user: { body: "<path d='M2' />" } } },
    ]);
    expect(source).toContain("mynaui");
    expect(source).toContain("config");
    expect(source).toContain("<path d='M1' />");
    expect(source).toContain("ep");
  });
});
