// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import {
  RoleKind,
  ScopeBindingKind,
  ScopeKind,
  type AuthorizationOption,
  type IamSelectOption,
} from "../models/iam";
import {
  reconcileAssignmentRoles,
  type PlatformAssignmentRoleDraft,
} from "../models/iam/platformAssignment";
import BizIamAssignmentScopeStep from "./BizIamAssignmentScopeStep.vue";

const role: AuthorizationOption = {
  id: "50",
  name: "应用管理员 · v1",
  roleRevisionRef: { id: "50", kind: RoleKind.PLATFORM_CUSTOM },
  parameterDefinitions: [{ key: "objects", kind: ScopeBindingKind.OBJECTS }],
  actions: [
    {
      id: "60",
      name: "查看应用",
      applicationId: "1",
      applicationName: "平台管理",
      resourceId: "20",
      resourceName: "应用目录",
      code: "iam-platform:application:read",
      scopeCapabilities: [ScopeKind.OBJECT_SET],
    },
  ],
  grants: [{ actionId: "60", scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "objects" }] }],
};

const stubs = {
  ElInput: true,
  ElCheckbox: true,
  ElTag: { template: "<span><slot /></span>" },
  ElAlert: true,
  ElPagination: true,
  InIcon: true,
  InBizTabsHeader: true,
  InDialog: { template: "<div />" },
  InButton: { template: "<button><slot /></button>" },
};

describe("指定对象确认与受控分配草稿", () => {
  it.each([
    { editing: false, hierarchical: false },
    { editing: true, hierarchical: false },
    { editing: false, hierarchical: true },
    { editing: true, hierarchical: true },
  ])(
    "确认一次更新 ID 与名称（编辑=$editing，树=$hierarchical）",
    async ({ editing, hierarchical }) => {
      const roles = ref(
        reconcileAssignmentRoles(
          [],
          [
            role,
            {
              ...role,
              id: "51",
              name: "另一个角色",
              roleRevisionRef: { id: "51", kind: RoleKind.PLATFORM_CUSTOM },
            },
          ],
        ),
      );
      roles.value[1].bindings.objects.ids = ["200"];
      roles.value[1].selectedObjects.objects = [{ id: "200", name: "另一个对象" }];
      if (editing) {
        roles.value[0].bindings.objects.ids = ["100", "101"];
        roles.value[0].selectedObjects.objects = [
          { id: "100", name: "旧应用" },
          { id: "101", name: "应用一" },
        ];
      }
      const selected: IamSelectOption[] = [
        { id: "101", name: "应用一" },
        { id: "102", name: "应用二" },
      ];
      const updates = vi.fn((next: PlatformAssignmentRoleDraft[]) => {
        roles.value = next;
      });
      const api = vi.fn(async () => ({
        data: { items: selected, total: 2, page: 1, pageSize: 20, supported: true, hierarchical },
      }));
      const show = vi.fn();
      const makeDialog = (name: string) =>
        defineComponent({
          name,
          emits: ["confirm"],
          setup(_props, { emit, expose }) {
            expose({ show, hide: vi.fn() });
            return () =>
              h(
                "button",
                { "data-testid": "confirm-objects", onClick: () => emit("confirm", selected) },
                "确定",
              );
          },
        });
      const MemberDialog = makeDialog("TestMemberDialog");
      const TreeDialog = makeDialog("TestTreeDialog");
      const Parent = defineComponent({
        setup: () => () =>
          h(BizIamAssignmentScopeStep, {
            roles: roles.value,
            "onUpdate:roles": updates,
            api,
            resetKey: 1,
          }),
      });
      const wrapper = mount(Parent, {
        global: {
          plugins: [createPinia()],
          stubs: {
            ...stubs,
            BizIamMemberPickerDialog: MemberDialog,
            BizIamTreeCandidateDialog: TreeDialog,
          },
        },
      });
      await flushPromises();
      updates.mockClear();
      const picker = wrapper.findComponent({ name: "BizIamDelegationCandidatePicker" });
      await picker.get('button[aria-label="请选择应用目录的范围对象"]').trigger("click");
      await flushPromises();
      // 打开/名称回显不修改完整绑定；确认通过真实选择器的同步事件链。
      expect(roles.value[0].bindings.objects.ids).toEqual(editing ? ["100", "101"] : []);
      expect(updates).not.toHaveBeenCalled();
      updates.mockClear();
      const dialog = picker.findComponent(hierarchical ? TreeDialog : MemberDialog);
      await dialog.get('[data-testid="confirm-objects"]').trigger("click");
      await flushPromises();
      expect(roles.value[0].bindings.objects.ids).toEqual(["101", "102"]);
      expect(roles.value[0].selectedObjects.objects).toEqual(selected);
      expect(updates).toHaveBeenCalledTimes(1);
      expect(picker.get('button[aria-label="请选择应用目录的范围对象"]').text()).toContain(
        "应用一、应用二",
      );
      expect(wrapper.get('[data-testid="scope-progress"]').text()).toContain(
        "已配置 2 项，待配置 0 项",
      );
      expect(roles.value[1].bindings.objects.ids).toEqual(["200"]);
      expect(roles.value[1].selectedObjects.objects).toEqual([{ id: "200", name: "另一个对象" }]);

      dialog.vm.$emit("confirm", []);
      await flushPromises();
      expect(roles.value[0].bindings.objects.ids).toEqual([]);
      expect(roles.value[0].selectedObjects.objects).toEqual([]);
      expect(roles.value[1].bindings.objects.ids).toEqual(["200"]);
      expect(wrapper.get('[data-testid="scope-progress"]').text()).toContain("待配置 1 项");
      wrapper.unmount();
    },
  );
});
