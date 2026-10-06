import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AssignmentEffectiveStatus,
  AssignmentSource,
  GrantStatus,
  IamAction,
  RoleKind,
  ScopeBindingKind,
  ScopeKind,
  SubjectType,
  type AuthorizationOption,
  type PlatformAssignmentRoleDraft,
  type ResourceDetail,
  type AssignmentRecord,
} from "@ingot/admin-common";
import MemberRoleAssignDialog from "./MemberRoleAssignDialog.vue";
import {
  emptyMemberRoleState,
  memberRoleChanges,
  type MemberRoleEditorState,
} from "../memberRoleEditor";
const api = vi.hoisted(() => ({ records: vi.fn(), selected: vi.fn() }));
vi.mock("@/api/iam/personnel", () => ({ PlatformMemberAssignmentsAPI: api.records }));
vi.mock("@/api/iam/authorization", () => ({
  PlatformAssignmentSelectedCandidatesAPI: api.selected,
  PlatformAssignmentCandidatesAPI: vi.fn(),
  PlatformAssignmentRoleCandidatesAPI: vi.fn(),
}));
const option: AuthorizationOption = {
  id: "31",
  name: "测试 · v1",
  roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "31" },
  roleNode: { id: "31", name: "v1", roleId: "24", roleName: "测试" },
  parameterDefinitions: [{ key: "objects", kind: ScopeBindingKind.OBJECTS }],
  grants: [
    {
      actionId: "1",
      scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "objects", includeDescendants: false }],
    },
  ],
  actions: [
    {
      id: "1",
      name: "编辑",
      code: "test:edit",
      applicationId: "1",
      applicationName: "应用",
      resourceId: "2",
      resourceName: "成员",
    },
  ],
};
const record = (id: string): ResourceDetail<AssignmentRecord> => ({
  record: {
    id,
    roleName: "测试",
    revisionNumber: "1",
    assignment: {
      subject: { type: SubjectType.MEMBER, id: "1001" },
      roleRevisionRef: option.roleRevisionRef!,
      scopeBindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: [id] } },
    },
    status: GrantStatus.ACTIVE,
    source: AssignmentSource.MANUAL,
  },
  version: "2",
  fieldAccess: {},
  capabilities: {
    [IamAction.PLATFORM_ASSIGNMENT_UPDATE]: { allowed: true },
    [IamAction.PLATFORM_ASSIGNMENT_DELETE]: { allowed: true },
  },
});
const button = defineComponent({
  props: ["disabled"],
  emits: ["in-click"],
  setup(props, { slots, emit }) {
    return () =>
      h("button", { disabled: props.disabled, onClick: () => emit("in-click") }, slots.default?.());
  },
});
const scope = defineComponent({
  props: ["roles"],
  emits: ["update:roles"],
  setup(props, { emit, expose }) {
    expose({ showOutstanding: vi.fn() });
    return () =>
      h(
        "button",
        {
          class: "configure",
          onClick: () =>
            emit(
              "update:roles",
              (props.roles as PlatformAssignmentRoleDraft[]).map((role, index) =>
                index === 0
                  ? {
                      ...role,
                      bindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: ["changed"] } },
                    }
                  : role,
              ),
            ),
        },
        "配置对象",
      );
  },
});
const mountDialog = (memberId?: string) =>
  mount(MemberRoleAssignDialog, {
    props: { memberId, canAdd: true, canUpdate: true, canRemove: true },
    global: {
      stubs: {
        InDialog: {
          name: "InDialog",
          props: ["modelValue"],
          template: "<div v-if='modelValue'><slot /><slot name='footer' /></div>",
        },
        InLoading: { template: "<div><slot /></div>" },
        InForm: { template: "<div><slot /></div>" },
        ElFormItem: { template: "<div><slot /></div>" },
        BizIamWizardNav: true,
        BizIamDurationFields: true,
        BizIamDelegationRolePicker: true,
        BizIamAssignmentScopeStep: scope,
        InButton: button,
        ElPagination: true,
        ElAlert: true,
      },
    },
  });
const click = async (wrapper: ReturnType<typeof mountDialog>, text: string) => {
  const target = wrapper.findAll("button").find((item) => item.text() === text)!;
  await target.trigger("click");
  await flushPromises();
};
beforeEach(() => {
  vi.clearAllMocks();
  api.records.mockResolvedValue({ data: { records: [record("81"), record("82")], total: 2 } });
  api.selected.mockResolvedValue({ data: { items: [option] } });
});
describe("成员角色两步弹窗", () => {
  it("创建选择固定版本后设置范围，确认前不改变外部草稿，取消保持原值", async () => {
    const draft = emptyMemberRoleState();
    draft.roles = [
      {
        option,
        bindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: ["before"] } },
        selectedObjects: {},
      },
    ];
    const wrapper = mountDialog();
    wrapper.vm.show(draft);
    await flushPromises();
    await click(wrapper, "下一步");
    await click(wrapper, "配置对象");
    await click(wrapper, "取消");
    expect(wrapper.emitted("confirm")).toBeUndefined();
    expect(draft.roles[0].bindings.objects.ids).toEqual(["before"]);
    wrapper.vm.show(draft);
    await flushPromises();
    await click(wrapper, "下一步");
    await click(wrapper, "配置对象");
    await click(wrapper, "确认配置");
    expect(
      (wrapper.emitted("confirm")![0][0] as MemberRoleEditorState).roles[0].bindings.objects.ids,
    ).toEqual(["changed"]);
    expect(api.records).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it("编辑读取有效非委派关联，旧同版本记录范围独立回显，只提交实际变化", async () => {
    const wrapper = mountDialog("1001");
    wrapper.vm.show();
    await flushPromises();
    expect(api.records).toHaveBeenCalledWith("1001", { current: 1, size: 20 }, undefined, {
      effectiveStatus: AssignmentEffectiveStatus.ACTIVE,
      directOnly: true,
    });
    await click(wrapper, "下一步");
    expect(api.selected).toHaveBeenCalledTimes(2);
    await click(wrapper, "配置对象");
    await click(wrapper, "确认配置");
    const state = wrapper.emitted("confirm")![0][0] as MemberRoleEditorState;
    expect(state.roles.map((item) => item.configurationKey)).toEqual([
      "assignment:81",
      "assignment:82",
    ]);
    expect(memberRoleChanges(state).updates.map((item) => item.assignmentId)).toEqual(["81"]);
    wrapper.unmount();
  });
  it("取消后的迟到关联响应不能覆盖重新打开的成员", async () => {
    let resolve!: (value: unknown) => void;
    api.records.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const wrapper = mountDialog("1001");
    wrapper.vm.show();
    await flushPromises();
    // 关闭由外层模型触发，加载中的旧请求仍必须失效。
    wrapper.findComponent({ name: "InDialog" }).vm.$emit("update:modelValue", false);
    await flushPromises();
    await wrapper.setProps({ memberId: "1002" });
    wrapper.vm.show();
    await flushPromises();
    resolve({ data: { records: [record("old")], total: 1 } });
    await flushPromises();
    expect(wrapper.text()).not.toContain("old");
    await click(wrapper, "下一步");
    await click(wrapper, "确认配置");
    expect(
      (wrapper.emitted("confirm")![0][0] as MemberRoleEditorState).stored.map(
        (item) => item.record.id,
      ),
    ).toEqual(["81", "82"]);
    wrapper.unmount();
  });
});
