import { mount, flushPromises } from "@vue/test-utils";
import { expect, it, vi } from "vitest";
import { RoleKind, SubjectType } from "@ingot/admin-common";
import MemberRolesField from "./MemberRolesField.vue";
const api = vi.hoisted(() => ({ bound: vi.fn() }));
vi.mock("@/api/iam/personnel", () => ({ PlatformMemberBoundRolesAPI: api.bound }));
it("只读预览使用有效角色摘要、不展示授权状态、不拉取编辑资料", async () => {
  api.bound.mockResolvedValue({
    data: {
      records: [
        {
          roleId: "24",
          name: "测试角色",
          roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "31" },
          revisionNumber: "1",
          sourceTypes: [SubjectType.MEMBER, SubjectType.GROUP],
        },
      ],
      total: 1,
    },
  });
  const wrapper = mount(MemberRolesField, {
    props: { memberId: "1001", editing: false, editable: false, canAdd: false },
    global: {
      stubs: { MemberRoleAssignDialog: true, InLoading: { template: "<div><slot /></div>" } },
    },
  });
  await flushPromises();
  expect(api.bound).toHaveBeenCalledWith("1001", { current: 1, size: 20 });
  expect(wrapper.text()).toContain("测试角色 · v1");
  expect(wrapper.text()).toContain("用户组继承，只读");
  expect(wrapper.text()).not.toMatch(/ACTIVE|REVOKED|有效|撤销/);
  wrapper.unmount();
});
