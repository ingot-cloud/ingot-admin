// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import Drawer from "./BizIamTenantAssignmentDrawer.vue";
import { RoleKind, ConfigurationStatus, type TenantAssignmentApis } from "../../models/iam";
vi.mock("@ingot/admin-core", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCapabilities: () => ({ unavailable: ref(false), contextEpoch: ref(0), hasAction: () => true }),
  refreshSessionPermissions: vi.fn().mockResolvedValue(undefined),
  Message: { success: vi.fn(), warning: vi.fn() },
}));
vi.mock("../../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));
const emptyDefinition = { items: [], definition: { grants: [], parameterDefinitions: [] } };
const role = (id: string) => ({
  id,
  name: `角色${id}`,
  code: `role-${id}`,
  kind: RoleKind.SHARED,
  status: ConfigurationStatus.ENABLED,
});
const source = (id: string, roleId: string) => ({
  id,
  allowedRoles: [role(roleId)],
  recipientSummary: "1名成员",
  maxAssignmentDuration: "P7D",
  scopeIssues: [],
  directAssignmentActions: [],
});
const apis = (): TenantAssignmentApis => ({
  mineAPI: vi.fn().mockResolvedValue({ data: [source("7", "1"), source("8", "2")] }),
  optionsAPI: vi.fn().mockResolvedValue({ data: { items: [], total: 0, page: 1, pageSize: 20 } }),
  roleAPI: vi.fn().mockResolvedValue({ data: emptyDefinition }),
  scopeAPI: vi.fn(),
  createAPI: vi.fn().mockResolvedValue({ data: { id: "100", version: "0" } }),
  previewAPI: vi.fn().mockResolvedValue({
    data: {
      valid: true,
      errors: [],
      warnings: [],
      version: "current",
      effectiveResult: { items: [] },
    },
  }),
  updateAPI: vi.fn(),
});
const stubs = {
  InDrawer: {
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
  },
  InForm: { template: "<div><slot/></div>" },
  ElFormItem: { template: "<div><slot/></div>" },
  ElSelect: { props: ["modelValue"], emits: ["update:modelValue"], template: "<div><slot/></div>" },
  ElOption: { props: ["value", "label"], template: "<span>{{label}}</span>" },
  ElAlert: true,
  InButton: {
    emits: ["inClick"],
    template: "<button @click=\"$emit('inClick')\"><slot/></button>",
  },
  BizIamDelegationCandidatePicker: true,
  BizIamDurationFields: true,
  BizIamPreviewAlert: true,
};
const setup = (api: TenantAssignmentApis) =>
  mount(Drawer, { props: { apis: api }, global: { stubs } });
describe("租户受限分配", () => {
  it("仅委派身份自动使用本人来源，候选回显和提交都引用roleId", async () => {
    const api = apis(),
      wrapper = setup(api);
    await wrapper.vm.show();
    await flushPromises();
    expect(wrapper.findComponent(stubs.ElSelect).props("modelValue")).toBe("7");
    expect(wrapper.text()).not.toContain("直接治理");
    const pickers = wrapper.findAllComponents({ name: "BizIamDelegationCandidatePicker" });
    pickers[0].vm.$emit("update:modelValue", "1");
    pickers[1].vm.$emit("update:modelValue", "4");
    await flushPromises();
    await pickers[1].props("api")({ kind: "MEMBER", ids: ["4"], page: 1, pageSize: 20 });
    expect(api.optionsAPI).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "MEMBER", delegationGrantId: "7", ids: ["4"] }),
    );
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "预览")!
      .trigger("click");
    await flushPromises();
    await wrapper
      .findAll("button")
      .find((item) => item.text().includes("保存，立即生效"))!
      .trigger("click");
    await flushPromises();
    const input = vi.mocked(api.createAPI).mock.calls[0][0];
    expect(input.items[0]).toMatchObject({
      roleId: "1",
      delegationGrantId: "7",
      subject: { type: "MEMBER", id: "4" },
    });
    expect(JSON.stringify(input)).not.toMatch(/Revision|versionName|upgrade/);
  });
  it("切换来源清理不兼容角色、人员和范围，旧角色响应不能恢复它们", async () => {
    const api = apis(),
      wrapper = setup(api);
    await wrapper.vm.show();
    await flushPromises();
    let resolve!: (value: { data: typeof emptyDefinition }) => void;
    vi.mocked(api.roleAPI).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const pickers = wrapper.findAllComponents({ name: "BizIamDelegationCandidatePicker" });
    pickers[0].vm.$emit("update:modelValue", "1");
    await flushPromises();
    wrapper.findComponent(stubs.ElSelect).vm.$emit("update:modelValue", "8");
    await flushPromises();
    resolve({ data: emptyDefinition });
    await flushPromises();
    expect(pickers[0].props("modelValue")).toBe("");
    expect(pickers[1].props("modelValue")).toBe("");
    await pickers[0].props("api")({ kind: "ROLE", page: 1, pageSize: 20 });
    expect(api.optionsAPI).toHaveBeenLastCalledWith(
      expect.objectContaining({ delegationGrantId: "8" }),
    );
  });
});
