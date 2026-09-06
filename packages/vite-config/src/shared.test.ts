import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveAdminCoreSourceAutoImportDirs,
  resolveAdminCoreSourceComponentDirs,
} from "./shared";

describe("resolveAdminCoreSourceAutoImportDirs", () => {
  it("未解析到 admin-core 源码时不追加目录", () => {
    expect(resolveAdminCoreSourceAutoImportDirs(undefined)).toEqual([]);
  });

  it("扫描 admin-core 的 hooks 与 stores，避免源码模式下自定义 composable 漏注入", () => {
    const adminCoreSrc = path.posix.join("workspace", "packages", "admin-core", "src");
    expect(resolveAdminCoreSourceAutoImportDirs(adminCoreSrc)).toEqual([
      `${adminCoreSrc}/hooks/**`,
      `${adminCoreSrc}/stores/**`,
    ]);
  });
});

describe("resolveAdminCoreSourceComponentDirs", () => {
  it("未解析到 admin-core 源码时不追加目录", () => {
    expect(resolveAdminCoreSourceComponentDirs(undefined)).toEqual([]);
  });

  it("扫描 admin-core 组件与布局 widgets，避免源码模式下 InAppBar 等无法解析", () => {
    const adminCoreSrc = path.posix.join("workspace", "packages", "admin-core", "src");
    expect(resolveAdminCoreSourceComponentDirs(adminCoreSrc)).toEqual([
      `${adminCoreSrc}/components`,
      `${adminCoreSrc}/layouts/widgets`,
    ]);
  });
});
