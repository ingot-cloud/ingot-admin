import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "DetailDrawer.vue"),
  "utf8",
);

describe("platform iam application DetailDrawer", () => {
  it("保存成功后关闭详情抽屉", () => {
    const saveBlock = source.slice(
      source.indexOf("PlatformApplicationUpdateAPI"),
      source.indexOf("const requireAppId"),
    );
    expect(saveBlock).toContain("session.exitEdit()");
    expect(saveBlock).toContain("visible.value = false");
    expect(saveBlock.indexOf("session.exitEdit()")).toBeLessThan(
      saveBlock.indexOf("visible.value = false"),
    );
  });

  it("应用编码用可复制标签展示", () => {
    expect(source).toContain('<in-copy-tag :text="detail.record.code" />');
    expect(source).not.toContain('label="基础应用"');
    expect(source).toContain("application-icon-field");
    expect(source).toContain("catalog-icon-preview");
    expect(source).toContain("icon: draft.icon");
  });

  it("资源行打开操作对话框，菜单走服务端树和中文枚举", () => {
    expect(source).toContain("privateOpenActions");
    expect(source).toContain("ActionListDialog");
    expect(source).toContain("PlatformMenuTreeAPI");
    expect(source).toContain('tree-column="name"');
    expect(source).toContain('name="catalog" :editable="false" fill');
    expect(source).toContain('name="menus" :editable="false" fill');
    expect(source).toContain("embedded-table");
    expect(source).toContain("搜索资源名");
    expect(source).toContain("搜索资源编码");
    expect(source).toContain("搜索菜单名");
    expect(source).toContain("in-filter-panel");
    expect(source).toContain("privateOpenMenu(asMenu(item))\">详情");
    expect(source).toContain("applicationCode");
    expect(source).toContain('type="danger"');
    expect(source).not.toContain("size: 200");
    expect(source).toContain("catalogReady");
    expect(source).toContain('name === "catalog"');
    expect(source).toContain('name === "menus"');
  });
});
