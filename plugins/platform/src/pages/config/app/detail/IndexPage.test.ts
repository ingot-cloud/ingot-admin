import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const basicInfoSource = readFileSync(resolve(dir, "components/BasicInfoPanel.vue"), "utf8");
const menuSource = readFileSync(resolve(dir, "components/MenuPanel.vue"), "utf8");
const permissionSource = readFileSync(resolve(dir, "components/PermissionPanel.vue"), "utf8");

describe("platform config app detail", () => {
  it("详情页使用 page 模式与 InPageHeader", () => {
    expect(pageSource).toContain('mode="page"');
    expect(pageSource).toContain('surface="workspace"');
    expect(pageSource).toContain("in-page-header");
    expect(pageSource).toContain("show-back");
    expect(pageSource).toContain("in-biz-tabs-header");
    expect(pageSource).toMatch(/<\/in-page-header>\s*<\/template>\s*<template #tabs>/);
  });

  it("基本信息将应用名称、应用图标、排序放在同一行", () => {
    expect(basicInfoSource).toMatch(
      /label="应用名称"[\s\S]*label="应用图标"[\s\S]*label="排序"[\s\S]*label="应用描述"/,
    );
    expect(basicInfoSource).toContain('<el-col :span="8">');
    expect(basicInfoSource).toContain('<el-col :span="10">');
    expect(basicInfoSource).toContain('<el-col :span="6">');
  });

  it("菜单面板接入表格工具且无 @refresh", () => {
    expect(menuSource).toContain("MENU_TABLE_ID");
    expect(menuSource).toContain('density="compact"');
    expect(menuSource).toContain("in-table-column-setting");
    expect(menuSource).toContain("applyColumnSelection");
    expect(menuSource).toContain("in-table-actions");
    expect(menuSource).not.toContain("@refresh");
    expect(menuSource).not.toContain("#toolbar");
  });

  it("权限面板接入表格工具且无 @refresh", () => {
    expect(permissionSource).toContain("PERMISSION_TABLE_ID");
    expect(permissionSource).toContain('density="compact"');
    expect(permissionSource).toContain("in-table-column-setting");
    expect(permissionSource).toContain("applyColumnSelection");
    expect(permissionSource).toContain("in-table-actions");
    expect(permissionSource).not.toContain("@refresh");
    expect(permissionSource).not.toContain("#toolbar");
  });
});
