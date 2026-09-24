import { describe, expect, it, vi } from "vitest";
import { AuthorizationDomain, MenuAccessMode, MenuKind, MenuMatchMode, ScopeKind } from "@ingot/admin-common";
import {
  APP_WIZARD_STEPS,
  catalogActionsOf,
  catalogError,
  emptyAppProfile,
  menuError,
  menusToTree,
  orderedMenus,
  previewActionCode,
  profileError,
  toApplicationBundle,
  type DraftMenu,
  type DraftResource,
} from "./createWizard";

vi.mock("@ingot/admin-common", () => ({
  AuthorizationDomain: { PLATFORM: "PLATFORM", TENANT: "TENANT" },
  MenuAccessMode: { OPEN: "OPEN", ACTION: "ACTION" },
  MenuKind: { PAGE: "PAGE", DIRECTORY: "DIRECTORY" },
  MenuMatchMode: { ANY: "ANY", ALL: "ALL" },
  ScopeKind: { ALL: "ALL" },
  ConfigurationStatus: { ENABLED: "ENABLED" },
}));

describe("application create wizard", () => {
  it("步骤为基础信息、资源与操作、菜单、预览创建", () => {
    expect(APP_WIZARD_STEPS.map((item) => item.title)).toEqual([
      "基础信息",
      "资源与操作",
      "菜单",
      "预览创建",
    ]);
  });

  it("基础信息缺少编码或名称时不能进入下一步", () => {
    expect(profileError(emptyAppProfile())).toBe("请填写编码和名称");
    expect(profileError({ ...emptyAppProfile(), code: "contacts", name: "通讯录" })).toBeUndefined();
  });

  it("操作码预览带上应用和资源编码", () => {
    expect(previewActionCode("iam-platform", "account", "read")).toBe("iam-platform:account:read");
  });

  it("资源与操作按应用和资源分层，供菜单关联", () => {
    const resources: DraftResource[] = [
      {
        tempId: "r1",
        code: "account",
        name: "账号",
        scopeCapabilities: [ScopeKind.ALL],
        fieldCapabilities: [],
        actions: [{ tempId: "a1", code: "read", name: "查看" }],
      },
    ];
    const actions = catalogActionsOf({ ...emptyAppProfile(), code: "iam-platform", name: "平台治理" }, resources);
    expect(actions[0]).toMatchObject({
      resourceName: "账号",
      applicationName: "平台治理",
      code: "iam-platform:account:read",
    });
    expect(catalogError(resources)).toBeUndefined();
  });

  it("菜单按父级顺序创建，开放准入不要求操作", () => {
    const child: DraftMenu = {
      tempId: "m2",
      parentTempId: "m1",
      name: "子菜单",
      kind: MenuKind.PAGE,
      accessMode: MenuAccessMode.OPEN,
      matchMode: MenuMatchMode.ANY,
      actionTempIds: [],
      sortOrder: 0,
    };
    const parent: DraftMenu = {
      tempId: "m1",
      name: "父菜单",
      kind: MenuKind.DIRECTORY,
      accessMode: MenuAccessMode.OPEN,
      matchMode: MenuMatchMode.ANY,
      actionTempIds: [],
      sortOrder: 0,
    };
    expect(orderedMenus([child, parent]).map((item) => item.tempId)).toEqual(["m1", "m2"]);
    expect(menuError([parent, child])).toBeUndefined();
    expect(menusToTree([parent, child])[0]?.children[0]?.record.name).toBe("子菜单");
  });

  it("预览提交映射为整包草稿，父菜单在前", () => {
    const resources: DraftResource[] = [
      {
        tempId: "r1",
        code: "account",
        name: "账号",
        scopeCapabilities: [ScopeKind.ALL],
        fieldCapabilities: [],
        actions: [{ tempId: "a1", code: "read", name: "查看" }],
      },
    ];
    const child: DraftMenu = {
      tempId: "m2",
      parentTempId: "m1",
      name: "子菜单",
      kind: MenuKind.PAGE,
      accessMode: MenuAccessMode.ACTION,
      matchMode: MenuMatchMode.ANY,
      actionTempIds: ["a1"],
      sortOrder: 1,
    };
    const parent: DraftMenu = {
      tempId: "m1",
      name: "父菜单",
      kind: MenuKind.DIRECTORY,
      accessMode: MenuAccessMode.OPEN,
      matchMode: MenuMatchMode.ANY,
      actionTempIds: ["a1"],
      sortOrder: 0,
    };
    const bundle = toApplicationBundle(
      { ...emptyAppProfile(), code: "contacts", name: "通讯录", description: "说明" },
      AuthorizationDomain.TENANT,
      resources,
      [child, parent],
    );
    expect(bundle.application).toMatchObject({
      code: "contacts",
      domain: AuthorizationDomain.TENANT,
      name: "通讯录",
      description: "说明",
    });
    expect(bundle.resources[0]?.actions[0]).toEqual({ tempId: "a1", code: "read", name: "查看" });
    expect(bundle.menus.map((item) => item.tempId)).toEqual(["m1", "m2"]);
    expect(bundle.menus[0]?.actionTempIds).toEqual([]);
    expect(bundle.menus[1]?.parentTempId).toBe("m1");
    expect(bundle.menus[1]?.actionTempIds).toEqual(["a1"]);
  });
});
