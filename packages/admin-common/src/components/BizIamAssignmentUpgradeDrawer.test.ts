// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import {
  RoleKind,
  ScopeKind,
  ScopeBindingKind,
  SubjectType,
  GrantStatus,
  AssignmentSource,
  type ResourceDetail,
  type AssignmentRecord,
  type AuthorizationOption,
} from "../models/iam";
import BizIamAssignmentUpgradeDrawer from "./BizIamAssignmentUpgradeDrawer.vue";
vi.mock("../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));
const option: AuthorizationOption = {
  id: "35",
  name: "运维 · v2",
  roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "35" },
  parameterDefinitions: [{ key: "targets", kind: ScopeBindingKind.OBJECTS }],
  grants: [{ actionId: "50", scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "targets" }] }],
  actions: [
    {
      id: "50",
      name: "查看",
      code: "iam-ops:incident:read",
      applicationId: "1",
      applicationName: "运维",
      resourceId: "2",
      resourceName: "工单",
      scopeCapabilities: [ScopeKind.OBJECT_SET],
    },
  ],
};
const row = (id: string): ResourceDetail<AssignmentRecord> => ({
  version: "0",
  capabilities: [],
  record: {
    id,
    subjectName: `成员${id}`,
    roleName: "运维",
    revisionNumber: 1,
    assignment: {
      subject: { type: SubjectType.MEMBER, id },
      roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "34" },
      scopeBindings: { targets: { kind: ScopeBindingKind.OBJECTS, ids: [`old${id}`] } },
    },
    status: GrantStatus.ACTIVE,
    source: AssignmentSource.MANUAL,
  },
});
const stubs = {
  InDrawer: {
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
  },
  InForm: { template: "<div><slot/></div>" },
  ElFormItem: { template: "<div><slot/></div>" },
  InButton: {
    props: ["disabled"],
    emits: ["inClick"],
    template: '<button :disabled="disabled" @click="$emit(\'inClick\')"><slot/></button>',
  },
  ElAlert: true,
  BizIamWizardNav: true,
  BizIamDelegationRolePicker: true,
  BizIamAssignmentScopeStep: {
    props: ["roles"],
    template: '<div class="scope">{{roles[0].bindings.targets.ids.join(",")}}</div>',
  },
  BizIamPreviewAlert: true,
};
function fixture() {
  const tree = vi.fn(async (q: { roleId?: string }) => ({
    data: {
      items: q.roleId
        ? [{ id: "35", name: "v2", revisionNumber: 2 }]
        : [{ id: "24", name: "运维" }],
      total: 1,
      page: 1,
      pageSize: 20,
    },
  }));
  const candidates = vi.fn(async () => ({
    data: { items: [option], total: 1, page: 1, pageSize: 20, supported: true },
  }));
  const preview = vi.fn(async (input) => ({
    data: {
      version: "35",
      valid: true,
      errors: [],
      warnings: [],
      effectiveResult: {
        targetRevisionRef: input.targetRevisionRef,
        items: [...input.items]
          .reverse()
          .map((item) => ({
            id: item.id,
            subject: { type: SubjectType.MEMBER, id: item.id },
            previousRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "34" },
            scopeBindings: item.scopeBindings || {
              targets: { kind: ScopeBindingKind.OBJECTS, ids: [`target${item.id}`] },
            },
            before: option.grants,
            after: option.grants,
            allowed: true,
            issues: [],
          })),
      },
    },
  }));
  const save = vi.fn(async () => ({ data: {} }));
  return {
    roleCandidatesApi: () => tree,
    candidatesApi: () => candidates,
    previewApi: preview,
    saveApi: save,
  };
}
async function click(wrapper: ReturnType<typeof mount>, label: string) {
  await wrapper
    .findAll("button")
    .find((button) => button.text() === label)!
    .trigger("click");
  await flushPromises();
}
describe("角色分配版本升级", () => {
  it("按分配ID对齐重用参数，预览通过才可提交固定目标，保留expectedVersion", async () => {
    const api = fixture();
    const wrapper = mount(BizIamAssignmentUpgradeDrawer, {
      props: api,
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.vm.open([row("82"), row("81")]);
    await flushPromises();
    expect(wrapper.findAll("button").some((button) => button.text() === "确认升级")).toBe(false);
    await click(wrapper, "下一步");
    await click(wrapper, "下一步");
    expect(wrapper.findAll(".scope").map((node) => node.text())).toEqual(["target82", "target81"]);
    await click(wrapper, "下一步");
    await click(wrapper, "预览影响");
    expect(wrapper.text()).toContain("old82 → target82");
    await click(wrapper, "确认升级");
    expect(api.saveApi).toHaveBeenCalledWith({
      targetRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "35" },
      items: [
        {
          id: "82",
          expectedVersion: "0",
          scopeBindings: { targets: { kind: ScopeBindingKind.OBJECTS, ids: ["target82"] } },
        },
        {
          id: "81",
          expectedVersion: "0",
          scopeBindings: { targets: { kind: ScopeBindingKind.OBJECTS, ids: ["target81"] } },
        },
      ],
    });
    wrapper.unmount();
  });
  it("新会话忽略旧候选迟到响应", async () => {
    const api = fixture();
    let resolve!: (value: unknown) => void;
    const delayed = new Promise((resolvePromise) => {
      resolve = resolvePromise;
    });
    api.roleCandidatesApi = () => vi.fn(() => delayed) as ReturnType<typeof api.roleCandidatesApi>;
    const wrapper = mount(BizIamAssignmentUpgradeDrawer, {
      props: api,
      global: { plugins: [createPinia()], stubs },
    });
    const first = wrapper.vm.open([row("81")]);
    await wrapper.setProps({ roleCandidatesApi: fixture().roleCandidatesApi });
    await wrapper.vm.open([row("82")]);
    resolve({ data: { items: [], total: 0, page: 1, pageSize: 20 } });
    await first;
    await flushPromises();
    expect(wrapper.text()).toContain("成员82");
    expect(wrapper.text()).not.toContain("没有可升级角色");
    wrapper.unmount();
  });
});
