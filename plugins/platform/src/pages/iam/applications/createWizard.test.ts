import { describe, expect, it } from "vitest";
import {
  AuthorizationDomain,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  ScopeKind,
} from "@ingot/admin-common";
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
  upsertDraftMenu,
  type DraftMenu,
  type DraftResource,
} from "./createWizard";

describe("application create wizard", () => {
  it("草稿菜单与整包保留路由名称、参数顺序及备注", () => {
    const draft = {
      name: "详情",
      kind: MenuKind.PAGE,
      path: "/orders",
      routeName: "order",
      accessMode: MenuAccessMode.OPEN,
      matchMode: MenuMatchMode.ANY,
      actionIds: [],
      sortOrder: 0,
      hidden: true,
      isCache: true,
      props: true,
      routeParams: [{ name: "a", remark: "编号" }, { name: "b" }],
    };
    const menus = upsertDraftMenu([], draft);
    const tree = menusToTree(menus);
    expect(tree[0]?.record.resolvedPath).toBe("/orders/:a/:b");
    const bundle = toApplicationBundle(
      { ...emptyAppProfile(), code: "orders", name: "订单" },
      AuthorizationDomain.TENANT,
      [],
      menus,
    );
    expect(bundle.menus[0]).toMatchObject({
      routeName: "order",
      hidden: true,
      isCache: true,
      props: true,
      routeParams: draft.routeParams,
    });
    draft.routeParams[0]!.name = "changed";
    expect(bundle.menus[0]?.routeParams?.[0]?.name).toBe("a");
    const disabled = upsertDraftMenu(menus, { ...draft, props: false }, menus[0]?.tempId);
    expect(disabled[0]?.routeParams).toEqual([]);
  });

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
    expect(
      profileError({ ...emptyAppProfile(), code: "contacts", name: "通讯录" }),
    ).toBeUndefined();
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
    const actions = catalogActionsOf(
      { ...emptyAppProfile(), code: "iam-platform", name: "平台治理" },
      resources,
    );
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
