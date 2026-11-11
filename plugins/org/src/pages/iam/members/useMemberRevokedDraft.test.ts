import { FieldVisibility, MemberStatus } from "@ingot/admin-common";
import { createPinia } from "pinia";
import { reactive, shallowRef } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMemberRevokedDraft } from "./useMemberRevokedDraft";

const mock = vi.hoisted(() => ({
  permissions: vi.fn(),
  router: vi.fn(),
  refresh: vi.fn(),
  member: vi.fn(),
  departmentTree: vi.fn(),
}));
vi.mock("@ingot/admin-core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ingot/admin-core")>()),
  getAdminRouter: mock.router,
  refreshSessionPermissions: mock.refresh,
  usePermissions: mock.permissions,
}));
vi.mock("@/api/iam/directory", () => ({
  TenantMemberDetailAPI: mock.member,
  TenantDepartmentTreeAPI: mock.departmentTree,
}));

const detail = {
  record: {
    id: "1",
    status: MemberStatus.ACTIVE,
    departments: [{ id: "10", name: "当前可见部门", primary: true }],
  },
  fieldAccess: {
    displayName: { visibility: FieldVisibility.FULL, editable: false },
    phone: { visibility: FieldVisibility.MASKED, editable: false },
  },
};
const draft = {
  profile: { displayName: "新显示名", phone: "未获准查看的草稿" },
  departments: [
    { id: "10", primary: true },
    { id: "20", primary: false },
  ],
};

describe("成员撤权草稿", () => {
  beforeEach(() => {
    mock.refresh.mockReset().mockResolvedValue(undefined);
    mock.member.mockReset().mockResolvedValue({ data: detail });
    mock.departmentTree.mockReset().mockResolvedValue({ data: [] });
  });

  const start = () => {
    const permissions = reactive({ contextEpoch: 1 });
    const currentRoute = shallowRef({ fullPath: "/org/iam/members" });
    mock.permissions.mockReturnValue(permissions);
    mock.router.mockReturnValue({ currentRoute });
    return { store: useMemberRevokedDraft(createPinia()), permissions, currentRoute };
  };

  it("恢复仍可读的草稿并剔除脱敏字段和不可见部门", async () => {
    const { store } = start();
    await store.recover("1", draft);
    expect(store.take()).toEqual({
      detail,
      profile: { displayName: "新显示名" },
      departments: [{ id: "10", name: "当前可见部门", primary: true, path: "" }],
    });
    expect(store.take()).toBeUndefined();
  });

  it("对象已不可读时不恢复草稿", async () => {
    const { store } = start();
    mock.member.mockRejectedValueOnce(new Error("404"));
    await store.recover("1", draft);
    expect(store.take()).toBeUndefined();
  });

  it.each(["identity", "route"])("忽略 %s 切换前的迟到详情", async (changed) => {
    const { store, permissions, currentRoute } = start();
    let resolve!: (response: { data: typeof detail }) => void;
    mock.member.mockReturnValueOnce(
      new Promise<{ data: typeof detail }>((done) => {
        resolve = done;
      }),
    );
    const result = store.recover("1", draft);
    await vi.waitFor(() => expect(mock.member).toHaveBeenCalledOnce());
    if (changed === "identity") permissions.contextEpoch += 1;
    else currentRoute.value = { fullPath: "/org/iam/departments" };
    resolve({ data: detail });
    await result;
    expect(store.take()).toBeUndefined();
  });
});
