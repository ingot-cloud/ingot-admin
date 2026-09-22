import { describe, expect, it } from "vitest";
import {
  AuthorizationDomain,
  ConfigurationStatus,
  FieldVisibility,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  IAM_MASKED_PLACEHOLDER,
  RoleKind,
  ScopeKind,
  SubjectType,
  UpgradeResolutionChoice,
} from "./constants";
import {
  buildDepartmentTree,
  collectIamPageRecords,
  emptySelection,
  entitlementCollectionVersion,
  editablePatch,
  filterMenuTree,
  flattenMenuTree,
  formatScopeKinds,
  isFieldEditable,
  isMaskedValue,
  mapIamPage,
  objectActionAllowed,
  resolveIamActionAccess,
  IAM_OBJECT_ACTION_DENIED_MESSAGE,
  toAssignmentBatchItems,
  toIamListParams,
  toIamSelectRecords,
  unresolvedUpgradeKeys,
} from "./helpers";
import type { DepartmentRecord } from "./types";

describe("iam helpers", () => {
  it("脱敏占位不进入提交 patch", () => {
    const access = {
      phone: { visibility: FieldVisibility.MASKED, editable: false },
      displayName: { visibility: FieldVisibility.FULL, editable: true },
    };
    expect(isMaskedValue(IAM_MASKED_PLACEHOLDER)).toBe(true);
    expect(isFieldEditable(access, "displayName")).toBe(true);
    expect(isFieldEditable(access, "phone")).toBe(false);
    expect(
      editablePatch(
        { displayName: "张三", phone: IAM_MASKED_PLACEHOLDER },
        access,
        ["displayName", "phone"],
      ),
    ).toEqual({ displayName: "张三" });
  });

  it("把 items/page 映射到现有分页模型", () => {
    expect(
      mapIamPage({
        items: [{ id: "1" }],
        total: 1,
        page: 2,
        pageSize: 20,
      }),
    ).toEqual({
      current: 2,
      size: 20,
      total: 1,
      records: [{ id: "1" }],
    });
    expect(toIamListParams({ current: 3, size: 10 }, { name: "a" })).toEqual({
      page: 3,
      pageSize: 10,
      name: "a",
    });
    expect(
      toIamListParams({ current: 1, size: 20 }, { name: "", status: undefined }),
    ).toEqual({
      page: 1,
      pageSize: 20,
    });
    expect(toIamListParams({ current: 1, size: 20 }, { baseline: false })).toEqual({
      page: 1,
      pageSize: 20,
      baseline: false,
    });
    expect(ConfigurationStatus.ENABLED).toBe("ENABLED");
    expect(AuthorizationDomain.PLATFORM).toBe("PLATFORM");
  });

  it("按默认页大小逐页收齐记录", async () => {
    const pages = [
      { records: ["a", "b"], total: 3 },
      { records: ["c"], total: 3 },
    ];
    const sizes: number[] = [];
    const records = await collectIamPageRecords(async (page) => {
      sizes.push(page.size ?? 0);
      return { data: pages[(page.current ?? 1) - 1] ?? { records: [], total: 0 } };
    }, 2);
    expect(records).toEqual(["a", "b", "c"]);
    expect(sizes).toEqual([2, 2]);
  });

  it("按应用 ID 排序拼开通集合版本", () => {
    expect(entitlementCollectionVersion([])).toBe("0");
    expect(
      entitlementCollectionVersion([
        {
          record: { id: "2", applicationId: "20", status: ConfigurationStatus.DISABLED, source: "MANUAL" },
          fieldAccess: {},
          capabilities: {},
          version: "3",
        },
        {
          record: { id: "1", applicationId: "9", status: ConfigurationStatus.ENABLED, source: "INITIALIZATION" },
          fieldAccess: {},
          capabilities: {},
          version: "1",
        },
      ]),
    ).toBe("9:1:1|20:3:0");
  });

  it("按 parentId 组装部门树，缺父节点的落为根", () => {
    const records: DepartmentRecord[] = [
      { id: "2", parentId: "1", name: "研发", sortOrder: 2, navigationOnly: false },
      { id: "1", name: "总部", sortOrder: 1, navigationOnly: false },
      { id: "9", parentId: "missing", name: "孤立", sortOrder: 3, navigationOnly: true },
    ];
    expect(buildDepartmentTree(records)).toEqual([
      { id: "1", name: "总部", children: [{ id: "2", name: "研发" }] },
      { id: "9", name: "孤立" },
    ]);
  });

  it("把 ResourceDetail 列表拍成选择器 id/name", () => {
    expect(
      toIamSelectRecords({
        current: 1,
        size: 20,
        total: 1,
        records: [
          {
            record: { id: "m1", displayName: "张三" },
            fieldAccess: {},
            capabilities: {},
            version: "1",
          },
        ],
      }),
    ).toEqual({
      current: 1,
      size: 20,
      total: 1,
      records: [{ id: "m1", name: "张三" }],
    });
  });

  it("用中文解释资源范围声明", () => {
    expect(formatScopeKinds([])).toBe("未声明");
    expect(formatScopeKinds([ScopeKind.ALL, ScopeKind.SELF])).toBe("全部、本人");
  });

  it("展开服务端菜单树为父菜单候选，不在前端组树", () => {
    const rows = flattenMenuTree([
      {
        record: {
          id: "1",
          applicationId: "a",
          name: "组织",
          kind: MenuKind.DIRECTORY,
          accessMode: MenuAccessMode.OPEN,
          matchMode: MenuMatchMode.ANY,
          actionIds: [],
          sortOrder: 1,
          status: ConfigurationStatus.ENABLED,
        },
        fieldAccess: {},
        capabilities: {},
        version: "0",
        children: [
          {
            record: {
              id: "2",
              applicationId: "a",
              name: "成员",
              kind: MenuKind.PAGE,
              accessMode: MenuAccessMode.ACTION,
              matchMode: MenuMatchMode.ANY,
              actionIds: [],
              sortOrder: 1,
              status: ConfigurationStatus.ENABLED,
            },
            fieldAccess: {},
            capabilities: {},
            version: "0",
            children: [],
          },
        ],
      },
    ]);
    expect(rows.map((item) => item.record.id)).toEqual(["1", "2"]);
  });

  it("按名称筛选菜单树时保留匹配节点的父级", () => {
    const filtered = filterMenuTree(
      [
        {
          record: {
            id: "1",
            applicationId: "a",
            name: "组织",
            kind: MenuKind.DIRECTORY,
            accessMode: MenuAccessMode.OPEN,
            matchMode: MenuMatchMode.ANY,
            actionIds: [],
            sortOrder: 1,
            status: ConfigurationStatus.ENABLED,
          },
          fieldAccess: {},
          capabilities: {},
          version: "0",
          children: [
            {
              record: {
                id: "2",
                applicationId: "a",
                name: "成员",
                kind: MenuKind.PAGE,
                accessMode: MenuAccessMode.ACTION,
                matchMode: MenuMatchMode.ANY,
                actionIds: [],
                sortOrder: 1,
                status: ConfigurationStatus.ENABLED,
              },
              fieldAccess: {},
              capabilities: {},
              version: "0",
              children: [],
            },
          ],
        },
      ],
      { name: "成员", kind: MenuKind.PAGE },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.record.id).toBe("1");
    expect(filtered[0]?.children[0]?.record.id).toBe("2");
  });

  it("升级冲突未逐项处置或替换范围缺 scopes 时不可提交", () => {
    expect(
      unresolvedUpgradeKeys(
        [
          { key: "a", reasonCode: "SCOPE", message: "范围冲突" },
          { key: "b", reasonCode: "DELTA", message: "差异冲突" },
        ],
        [{ key: "a", choice: UpgradeResolutionChoice.ACCEPT_BASE }],
      ),
    ).toEqual(["b"]);
    expect(
      unresolvedUpgradeKeys(
        [{ key: "a", reasonCode: "SCOPE", message: "范围冲突" }],
        [{ key: "a", choice: UpgradeResolutionChoice.REPLACE_SCOPE }],
      ),
    ).toEqual(["a"]);
    expect(
      unresolvedUpgradeKeys(
        [{ key: "a", reasonCode: "SCOPE", message: "范围冲突" }],
        [
          {
            key: "a",
            choice: UpgradeResolutionChoice.REPLACE_SCOPE,
            scopes: [{ kind: ScopeKind.SELF }],
          },
        ],
      ),
    ).toEqual([]);
  });

  it("按接收对象展开原子分配批次，不默认带空主体", () => {
    expect(
      toAssignmentBatchItems(SubjectType.MEMBER, ["m1", " ", "m2"], {
        roleRevisionRef: { kind: RoleKind.TENANT_CUSTOM, id: "r1" },
        scopeBindings: {},
      }),
    ).toEqual([
      {
        subject: { type: SubjectType.MEMBER, id: "m1" },
        roleRevisionRef: { kind: RoleKind.TENANT_CUSTOM, id: "r1" },
        scopeBindings: {},
      },
      {
        subject: { type: SubjectType.MEMBER, id: "m2" },
        roleRevisionRef: { kind: RoleKind.TENANT_CUSTOM, id: "r1" },
        scopeBindings: {},
      },
    ]);
  });

  it("空选择器不携带成员或部门", () => {
    expect(emptySelection()).toEqual({ members: [], departments: [] });
  });

  it("列表未返回对象能力时不禁用，明确拒绝时给出原因", () => {
    expect(objectActionAllowed({}, "iam-platform:tenant:read")).toEqual({ allowed: true });
    expect(
      objectActionAllowed(
        { "iam-platform:tenant:read": { allowed: false, message: "超出数据范围" } },
        "iam-platform:tenant:read",
      ),
    ).toEqual({ allowed: false, message: "超出数据范围" });
    expect(
      objectActionAllowed({ "iam-platform:tenant:read": { allowed: false } }, "iam-platform:tenant:read"),
    ).toEqual({ allowed: false, message: IAM_OBJECT_ACTION_DENIED_MESSAGE });
    expect(
      resolveIamActionAccess("iam-platform:tenant:read", { hasAction: false, capabilities: {} }),
    ).toEqual({ visible: false, allowed: false });
  });
});
