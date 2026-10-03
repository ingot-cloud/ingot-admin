// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleWorkspaceQuery } from "@ingot/admin-common";
import { useRoleWorkspace } from "./useRoleWorkspace";

type Options = { enabled: () => boolean; queryWhen: (query: RoleWorkspaceQuery) => boolean };
const fixture = vi.hoisted(() => ({
  assignmentRead: true,
  roleRead: true,
  options: [] as Options[],
}));
vi.mock("@ingot/admin-core", async () => {
  const { reactive, ref } = await import("vue");
  return {
    createResourceQueryKeys: vi.fn(),
    useCapabilities: () => ({
      unavailable: ref(false),
      hasAction: (action: string) =>
        action === "role:read" ? fixture.roleRead : fixture.assignmentRead,
    }),
    useServerPaging: (options: Options) => {
      fixture.options.push(options);
      return {
        condition: reactive<RoleWorkspaceQuery>({}),
        search: vi.fn(),
        query: { data: ref(undefined) },
      };
    },
  };
});
vi.mock("@ingot/admin-common", () => ({
  IamAction: { PLATFORM_ROLE_READ: "role:read", PLATFORM_ASSIGNMENT_READ: "assignment:read" },
  createIamPageQueryOptions: vi.fn(),
}));
vi.mock("@/api/iam/authorization.query", () => ({
  PlatformRoleSubjectPageQueryOptions: {},
  PlatformRoleSourcePageQueryOptions: {},
}));
vi.mock("@/api/iam/authorization", () => ({ PlatformRoleRevisionPageAPI: vi.fn() }));

beforeEach(() => {
  fixture.options = [];
  fixture.assignmentRead = true;
  fixture.roleRead = true;
});
const openWorkspace = () => {
  const active = ref(true);
  let workspace!: ReturnType<typeof useRoleWorkspace>;
  const wrapper = mount(
    defineComponent({
      setup() {
        workspace = useRoleWorkspace(active);
        return () => h("div");
      },
    }),
  );
  return { active, workspace, wrapper };
};
describe("角色关联工作区查询边界", () => {
  it("角色读取不等于分配读取，只激活当前主体页且不预取来源和版本", async () => {
    const { workspace, active, wrapper } = openWorkspace();
    workspace.roleId.value = "40";
    await nextTick();
    expect(fixture.options.map((option) => option.enabled())).toEqual([true, false, false]);
    expect(workspace.subjects.condition).toEqual({
      roleId: "40",
      subjectKind: "members",
      revisionId: undefined,
      keyword: undefined,
    });
    fixture.assignmentRead = false;
    expect(fixture.options[0].enabled()).toBe(false);
    fixture.assignmentRead = true;
    active.value = false;
    expect(fixture.options[0].enabled()).toBe(false);
    wrapper.unmount();
  });
  it("来源绑定实际角色成员及固定版本，切换角色清理旧来源与版本", async () => {
    const { workspace, wrapper } = openWorkspace();
    workspace.roleId.value = "40";
    await nextTick();
    workspace.version.value = { id: "31", number: "1" };
    await nextTick();
    workspace.showSources("2");
    workspace.showVersions();
    expect(workspace.sources.condition).toEqual({ roleId: "40", memberId: "2", revisionId: "31" });
    expect(fixture.options.map((option) => option.enabled())).toEqual([true, true, true]);
    workspace.roleId.value = "50";
    await nextTick();
    expect(workspace.version.value).toBeUndefined();
    expect(fixture.options.map((option) => option.enabled())).toEqual([true, false, false]);
    expect(workspace.subjects.condition.roleId).toBe("50");
    wrapper.unmount();
  });
});
