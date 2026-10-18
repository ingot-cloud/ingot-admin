// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@ingot/http-client";
import {
  IamAction,
  RoleKind,
  ConfigurationStatus,
  ScopeKind,
  ScopeBindingKind,
  type CurrentRoleApis,
} from "../../models/iam";
import Drawer from "./BizIamCurrentRoleDrawer.vue";
import Editor from "./BizIamCurrentPermissionEditor.vue";
const state = vi.hoisted(() => ({ epoch: 0 }));
const refresh = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("@ingot/admin-core", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCapabilities: () => ({
    unavailable: ref(false),
    contextEpoch: ref(state.epoch),
    hasAction: () => true,
  }),
  refreshSessionPermissions: refresh,
  Message: { success: vi.fn(), warning: vi.fn() },
}));
vi.mock("../../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));
const stubs = {
  InDrawer: {
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
  },
  InForm: { template: "<div><slot/></div>" },
  InBizTabs: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      "<div><button data-tab=\"permissions\" @click=\"$emit('update:modelValue','permissions')\">权限</button><slot/></div>",
  },
  InBizTabPanel: { template: "<div><slot/></div>" },
  InButton: {
    emits: ["inClick"],
    template: "<button @click=\"$emit('inClick')\"><slot/></button>",
  },
  ElFormItem: { template: "<div><slot/></div>" },
  ElInput: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"/>',
  },
  ElAlert: { props: ["title"], template: "<p>{{title}}</p>" },
  ElSwitch: true,
  BizIamCurrentPermissionEditor: true,
  BizIamPreviewAlert: true,
};
const definition = { grants: [], parameterDefinitions: [] };
const detail = (kind = RoleKind.TENANT_CUSTOM, version = "1") => ({
  data: {
    record: { id: "1", code: "role", name: "角色", kind, status: ConfigurationStatus.ENABLED },
    version,
    capabilities: {
      [IamAction.TENANT_ROLE_UPDATE]: { allowed: true },
      [IamAction.TENANT_ROLE_STATUS]: { allowed: true },
    },
  },
});
const apis = (): CurrentRoleApis => ({
  detailAPI: vi.fn().mockResolvedValue(detail()),
  grantsAPI: vi.fn().mockResolvedValue({ data: { items: [], definition } }),
  createAPI: vi.fn().mockResolvedValue({ data: { id: "2", version: "1" } }),
  createPreviewAPI: vi.fn().mockResolvedValue({ data: { valid: true, result: {} } }),
  previewAPI: vi.fn().mockResolvedValue({ data: { valid: true, result: {} } }),
  saveAPI: vi.fn().mockResolvedValue({ data: { roleId: "1", version: "2" } }),
  profileAPI: vi.fn().mockResolvedValue(detail()),
});
const mountDrawer = (api: CurrentRoleApis) =>
  mount(Drawer, {
    props: { apis: api, catalogAPI: vi.fn(), applicationCandidates: vi.fn() },
    global: { stubs },
  });
const button = (wrapper: ReturnType<typeof mountDrawer>, text: string) =>
  wrapper.findAll("button").find((item) => item.text().includes(text))!;

describe("当前租户角色交互", () => {
  beforeEach(() => {
    refresh.mockClear();
  });
  it("共享角色只读，当前权限按Tab加载，界面没有版本或定制操作", async () => {
    const api = apis();
    vi.mocked(api.detailAPI).mockResolvedValue(detail(RoleKind.SHARED));
    const wrapper = mountDrawer(api);
    await wrapper.vm.show("1");
    await flushPromises();
    expect(api.grantsAPI).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("平台共享角色由平台维护");
    expect(wrapper.text()).not.toMatch(/发布|升级|定制|版本/);
    expect(wrapper.findAll("button").map((item) => item.text())).not.toContain("保存基本信息");
    await wrapper.get('[data-tab="permissions"]').trigger("click");
    await flushPromises();
    expect(api.grantsAPI).toHaveBeenCalledOnce();
    expect(wrapper.findComponent({ name: "BizIamCurrentPermissionEditor" }).props("readonly")).toBe(
      true,
    );
  });
  it("私有角色保存当前定义后刷新；409重读锁保留草稿并要求再预览", async () => {
    const api = apis();
    const wrapper = mountDrawer(api);
    await wrapper.vm.show("1");
    await wrapper.get('[data-tab="permissions"]').trigger("click");
    await flushPromises();
    await button(wrapper, "预览").trigger("click");
    await flushPromises();
    vi.mocked(api.saveAPI).mockRejectedValueOnce(
      new ApiError({ kind: "http", status: 409, message: "conflict" }),
    );
    await button(wrapper, "保存权限").trigger("click");
    await flushPromises();
    vi.mocked(api.detailAPI).mockResolvedValue(detail(RoleKind.TENANT_CUSTOM, "3"));
    await button(wrapper, "重读当前配置").trigger("click");
    await flushPromises();
    await button(wrapper, "预览").trigger("click");
    await flushPromises();
    expect(api.previewAPI).toHaveBeenLastCalledWith("1", { expectedVersion: "3", definition });
    await button(wrapper, "保存权限").trigger("click");
    await flushPromises();
    expect(refresh).toHaveBeenCalledOnce();
    expect(wrapper.emitted("success")).toHaveLength(1);
    expect(api.saveAPI).toHaveBeenLastCalledWith("1", { expectedVersion: "3", definition });
  });
  it("切换角色后旧详情迟到不能覆盖当前实体", async () => {
    const api = apis();
    let resolve!: (value: ReturnType<typeof detail>) => void;
    vi.mocked(api.detailAPI).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const wrapper = mountDrawer(api);
    const old = wrapper.vm.show("1");
    await wrapper.vm.show();
    resolve(detail());
    await old;
    await flushPromises();
    expect(wrapper.findAll("input")[0].element.value).toBe("");
  });
  it("删除命名范围同时清理闲置参数，同资源使用已有稳定键", async () => {
    const model = {
      grants: [
        {
          actionId: "11",
          scopes: [{ kind: ScopeKind.MANAGED_DEPARTMENTS, parameterKey: "stable" }],
        },
      ],
      parameterDefinitions: [
        { key: "stable", kind: ScopeBindingKind.DEPARTMENTS, resourceId: "6" },
      ],
    };
    const wrapper = mount(Editor, {
      props: {
        modelValue: model,
        items: [
          {
            actionId: "11",
            actionCode: "tenant:read",
            actionName: "读取",
            applicationId: "1",
            applicationName: "应用",
            resourceId: "6",
            resourceName: "成员",
            enabled: true,
            scopeCapabilities: [ScopeKind.ALL, ScopeKind.MANAGED_DEPARTMENTS],
            parameterDefinitions: [
              { key: "other", kind: ScopeBindingKind.DEPARTMENTS, resourceId: "6" },
            ],
          },
        ],
        catalogAPI: vi.fn(),
        applicationCandidates: vi.fn(),
      },
      global: {
        stubs: {
          InButton: stubs.InButton,
          ElSelect: true,
          ElOption: true,
          ElCheckbox: true,
          ElPagination: true,
          ElInput: true,
          BizIamDelegationCandidatePicker: true,
        },
      },
    });
    const remove = wrapper.findAll("button").find((item) => item.text().includes("删除范围"));
    expect(remove).toBeDefined();
    await remove!.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toEqual({
      grants: [{ actionId: "11", scopes: [] }],
      parameterDefinitions: [],
    });
  });
});
