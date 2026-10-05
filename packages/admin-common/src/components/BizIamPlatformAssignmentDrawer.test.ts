// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { Message, type R } from "@ingot/admin-core";
import {
  AssignmentSource,
  GrantStatus,
  IamAction,
  RoleKind,
  ScopeKind,
  ScopeBindingKind,
  SubjectType,
  type AssignmentBatchInput,
  type AssignmentContext,
  type AssignmentPreviewResult,
  type AssignmentRecord,
  type AuthorizationOption,
  type Preview,
  type ResourceDetail,
} from "../models/iam";
import BizIamPlatformAssignmentDrawer from "./BizIamPlatformAssignmentDrawer.vue";

vi.mock("../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));
const role = (id: string): AuthorizationOption => ({
  id,
  name: `角色${id} · v1`,
  roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id },
  parameterDefinitions: [],
  grants: [{ actionId: id, scopes: [{ kind: ScopeKind.ALL }] }],
  actions: [
    {
      id,
      name: "查看应用",
      applicationId: "1",
      applicationName: "平台管理",
      resourceId: "330",
      resourceName: "应用",
      code: "iam-platform:application:read",
      scopeCapabilities: [ScopeKind.ALL],
    },
  ],
});
const options = [role("31"), role("32")];
const stubs = {
  InDrawer: {
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
  },
  InForm: { template: "<div><slot /></div>" },
  ElFormItem: { props: ["label"], template: "<div>{{label}}<slot /></div>" },
  InButton: {
    props: ["disabled"],
    emits: ["inClick"],
    template: '<button :disabled="disabled" @click="$emit(\'inClick\')"><slot /></button>',
  },
  BizIamAuthorizationRecipients: {
    emits: ["update:members", "update:groups"],
    template:
      "<button @click=\"$emit('update:members', [{id: '1', name: 'A'}]); $emit('update:groups', [{id: '80', name: '用户组'}])\">选择接收对象</button>",
  },
  BizIamDelegationRolePicker: {
    name: "BizIamDelegationRolePicker",
    emits: ["update:modelValue"],
    setup: () => ({ options }),
    template: "<button @click=\"$emit('update:modelValue', options)\">选择两个角色</button>",
  },
  BizIamAssignmentScopeStep: true,
  BizIamWizardNav: true,
  BizIamDurationFields: {
    name: "BizIamDurationFields",
    props: ["validFrom", "validUntil"],
    emits: ["update:validFrom", "update:validUntil"],
    template: "<div>设置有效期</div>",
  },
  BizIamPreviewAlert: true,
  ElAlert: true,
};
const props = () => ({
  candidatesApi: vi.fn(),
  roleCandidatesApi: vi.fn(),
  contextApi: vi.fn(async () => ({ data: { directCreate: true } }) as R<AssignmentContext>),
  getApi: vi.fn(),
  selectedCandidatesApi: vi.fn(async () => ({
    data: { items: [options[0]], total: 1, page: 1, pageSize: 20, supported: true },
  })),
  createApi: vi.fn(),
  updateApi: vi.fn(),
  updatePreviewApi: vi.fn(),
  previewApi: vi.fn(
    async (input: AssignmentBatchInput) =>
      ({
        data: {
          version: "0",
          valid: true,
          errors: [],
          warnings: [],
          effectiveResult: {
            items: input.items.map((item) => ({
              subject: item.subject,
              allowed: true,
              errors: [],
              grants: [],
            })),
          },
        },
      }) as R<Preview<AssignmentPreviewResult>>,
  ),
});

describe("平台角色分配向导", () => {
  it("范围尚未配置时下一步展示全量待办，不能进入预览", async () => {
    const api = props();
    const showOutstanding = vi.fn();
    const warning = vi.spyOn(Message, "warning").mockImplementation(() => undefined);
    const pending: AuthorizationOption = {
      ...options[0],
      parameterDefinitions: [{ key: "objects", kind: ScopeBindingKind.OBJECTS }],
      grants: [
        { actionId: "31", scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "objects" }] },
      ],
    };
    const wrapper = mount(BizIamPlatformAssignmentDrawer, {
      props: api,
      global: {
        plugins: [createPinia()],
        stubs: {
          ...stubs,
          BizIamDelegationRolePicker: {
            emits: ["update:modelValue"],
            setup: () => ({ pending }),
            template:
              "<button @click=\"$emit('update:modelValue', [pending])\">选择待配置角色</button>",
          },
          BizIamAssignmentScopeStep: {
            setup: () => ({ showOutstanding }),
            template: "<div>待配置对象</div>",
          },
        },
      },
    });
    await wrapper.vm.show();
    const click = async (text: string): Promise<void> => {
      await wrapper
        .findAll("button")
        .find((item) => item.text() === text)!
        .trigger("click");
      await flushPromises();
    };
    await click("选择接收对象");
    await click("下一步");
    await click("选择待配置角色");
    await click("下一步");
    await click("下一步");
    expect(showOutstanding).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("请配置指定对象"));
    expect(wrapper.findAll("button").some((item) => item.text() === "预览效果")).toBe(false);
    expect(api.previewApi).not.toHaveBeenCalled();
    warning.mockRestore();
    wrapper.unmount();
  });
  it("成员和用户组乘以角色生成批次，预览通过后才显示提交", async () => {
    const api = props();
    const wrapper = mount(BizIamPlatformAssignmentDrawer, {
      props: api,
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.vm.show();
    const click = async (text: string): Promise<void> => {
      const button = wrapper.findAll("button").find((item) => item.text() === text);
      expect(button, text).toBeDefined();
      await button!.trigger("click");
      await flushPromises();
    };
    await click("选择接收对象");
    await click("下一步");
    await click("选择两个角色");
    expect(wrapper.findComponent({ name: "BizIamDurationFields" }).exists()).toBe(true);
    await click("下一步");
    expect(wrapper.findComponent({ name: "BizIamDurationFields" }).exists()).toBe(false);
    await click("下一步");
    expect(wrapper.findAll("button").some((item) => item.text() === "分配角色")).toBe(false);
    await click("预览效果");
    expect(api.previewApi).toHaveBeenCalledOnce();
    const batch = api.previewApi.mock.calls[0][0];
    expect(batch.items.map((item) => [item.subject.type, item.roleRevisionRef.id])).toEqual([
      [SubjectType.MEMBER, "31"],
      [SubjectType.MEMBER, "32"],
      [SubjectType.GROUP, "31"],
      [SubjectType.GROUP, "32"],
    ]);
    expect(wrapper.text()).toContain("成员 / A · 角色31 · v1");
    expect(wrapper.text()).toContain("用户组 / 用户组 · 角色32 · v1");
    expect(wrapper.findAll("button").some((item) => item.text() === "分配角色")).toBe(true);
    await click("上一步");
    await click("上一步");
    await click("选择两个角色");
    expect(wrapper.findAll("button").some((item) => item.text() === "分配角色")).toBe(false);
    expect(api.createApi).not.toHaveBeenCalled();
  });
  it("编辑固定记录通过关联接口加载版本，不请求创建上下文或更换角色", async () => {
    const api = props();
    const record: ResourceDetail<AssignmentRecord> = {
      version: "1",
      capabilities: { [IamAction.PLATFORM_ASSIGNMENT_UPDATE]: { allowed: true } },
      record: {
        id: "90",
        roleName: "角色31",
        revisionNumber: "1",
        subjectName: "A",
        status: GrantStatus.ACTIVE,
        source: AssignmentSource.MANUAL,
        assignment: {
          subject: { type: SubjectType.MEMBER, id: "1" },
          roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "31" },
          scopeBindings: {},
        },
      },
    };
    api.getApi.mockResolvedValue({ data: record });
    const wrapper = mount(BizIamPlatformAssignmentDrawer, {
      props: api,
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.vm.show(record);
    await flushPromises();
    expect(api.selectedCandidatesApi).toHaveBeenCalledWith("90", {
      kind: "ROLE_REVISION",
      page: 1,
      pageSize: 20,
    });
    expect(api.contextApi).not.toHaveBeenCalled();
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "下一步")!
      .trigger("click");
    expect(wrapper.findComponent({ name: "BizIamDelegationRolePicker" }).exists()).toBe(false);
    expect(wrapper.text()).toContain("角色31 · v1");
    expect(wrapper.findComponent({ name: "BizIamDurationFields" }).exists()).toBe(true);
  });

  it("第二步拦截反向有效期，修正后进入独立范围步骤", async () => {
    const api = props();
    const wrapper = mount(BizIamPlatformAssignmentDrawer, {
      props: api,
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.vm.show();
    const click = async (text: string): Promise<void> => {
      await wrapper
        .findAll("button")
        .find((item) => item.text() === text)!
        .trigger("click");
      await flushPromises();
    };
    await click("选择接收对象");
    await click("下一步");
    await click("选择两个角色");
    const dates = wrapper.findComponent({ name: "BizIamDurationFields" });
    dates.vm.$emit("update:validFrom", "2099-10-06T00:00:00Z");
    dates.vm.$emit("update:validUntil", "2099-10-05T00:00:00Z");
    await flushPromises();
    expect(
      wrapper
        .findAll("button")
        .find((item) => item.text() === "下一步")!
        .attributes("disabled"),
    ).toBeDefined();
    dates.vm.$emit("update:validUntil", "2099-10-07T00:00:00Z");
    await flushPromises();
    await click("下一步");
    expect(wrapper.findComponent({ name: "BizIamAssignmentScopeStep" }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: "BizIamDurationFields" }).exists()).toBe(false);
    wrapper.unmount();
  });

  it("编辑可以调整具体对象，提交保留固定主体版本，调整后旧预览失效", async () => {
    const api = props();
    const fixed: AuthorizationOption = {
      ...options[0],
      parameterDefinitions: [{ key: "objects", kind: ScopeBindingKind.OBJECTS }],
      grants: [
        { actionId: "31", scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "objects" }] },
      ],
    };
    const record: ResourceDetail<AssignmentRecord> = {
      version: "2",
      capabilities: { [IamAction.PLATFORM_ASSIGNMENT_UPDATE]: { allowed: true } },
      record: {
        id: "90",
        roleName: "角色31",
        revisionNumber: "1",
        subjectName: "A",
        status: GrantStatus.ACTIVE,
        source: AssignmentSource.MANUAL,
        assignment: {
          subject: { type: SubjectType.MEMBER, id: "1" },
          roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "31" },
          scopeBindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: ["100"] } },
        },
      },
    };
    api.getApi.mockResolvedValue({ data: record });
    api.selectedCandidatesApi.mockResolvedValue({
      data: { items: [fixed], total: 1, page: 1, pageSize: 20, supported: true },
    });
    api.updatePreviewApi.mockImplementation(async (_id, input) =>
      api.previewApi({ items: [input.assignment] }),
    );
    const wrapper = mount(BizIamPlatformAssignmentDrawer, {
      props: api,
      global: {
        plugins: [createPinia()],
        stubs: {
          ...stubs,
          BizIamAssignmentScopeStep: {
            name: "BizIamAssignmentScopeStep",
            props: ["roles", "readonly"],
            emits: ["update:roles"],
            template:
              "<button :disabled=\"readonly\" @click=\"$emit('update:roles', [{...roles[0], bindings: {objects: {kind: 'OBJECTS', ids: ['101']}}}])\">修改范围对象</button>",
          },
        },
      },
    });
    await wrapper.vm.show(record);
    const click = async (text: string): Promise<void> => {
      await wrapper
        .findAll("button")
        .find((item) => item.text() === text)!
        .trigger("click");
      await flushPromises();
    };
    await click("下一步");
    await click("下一步");
    await click("修改范围对象");
    await click("下一步");
    await click("预览效果");
    expect(api.updatePreviewApi).toHaveBeenCalledWith("90", {
      expectedVersion: "2",
      assignment: {
        ...record.record.assignment,
        scopeBindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: ["101"] } },
        validFrom: undefined,
        validUntil: undefined,
        delegationGrantId: undefined,
      },
    });
    expect(wrapper.findAll("button").some((item) => item.text() === "保存")).toBe(true);
    await click("上一步");
    await click("修改范围对象");
    await click("下一步");
    expect(wrapper.findAll("button").some((item) => item.text() === "保存")).toBe(false);
    await click("预览效果");
    await click("保存");
    expect(api.updateApi).toHaveBeenCalledWith(
      "90",
      expect.objectContaining({
        expectedVersion: "2",
        assignment: expect.objectContaining({
          subject: record.record.assignment.subject,
          roleRevisionRef: record.record.assignment.roleRevisionRef,
          scopeBindings: { objects: { kind: ScopeBindingKind.OBJECTS, ids: ["101"] } },
        }),
      }),
    );
    wrapper.unmount();
  });
});
