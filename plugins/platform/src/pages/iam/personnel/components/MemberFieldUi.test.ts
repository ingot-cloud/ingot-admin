import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateTime } from "@ingot/shared";
import {
  FieldVisibility,
  IamAction,
  MemberStatus,
  type ResourceDetail,
  type MemberRecord,
} from "@ingot/admin-common";
import MemberDetailDrawer from "./MemberDetailDrawer.vue";

const api = vi.hoisted(() => ({
  detail: vi.fn(),
  update: vi.fn(),
  preview: vi.fn(),
  rolesAllowed: false,
}));
vi.mock("@/api/iam/personnel", () => ({
  PlatformMemberDetailAPI: api.detail,
  PlatformMemberUpdateAPI: api.update,
  PlatformMemberEditPreviewAPI: api.preview,
  PlatformMemberGroupsAPI: vi.fn(),
  PlatformMemberAssignmentsAPI: vi.fn(),
  PlatformMemberRolesAPI: vi.fn(() => Promise.resolve({ data: [] })),
  PlatformMemberRemoveAPI: vi.fn(),
  PlatformMemberStatusAPI: vi.fn(),
}));
vi.mock("@/api/iam/personnel.query", () => ({
  platformMemberQueryKeys: { lists: () => ["member", "list"] },
}));
vi.mock("../useDirectRoleEligibility", () => ({
  useDirectRoleEligibility: () => ({
    canGrantDirect: ref(api.rolesAllowed),
    canReadDirect: ref(api.rolesAllowed),
    canUpdateDirect: ref(api.rolesAllowed),
    canRevokeDirect: ref(api.rolesAllowed),
    refresh: vi.fn(),
  }),
}));
vi.mock("@tanstack/vue-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@ingot/admin-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-core")>();
  return {
    ...actual,
    useCapabilities: () => ({ hasAction: () => false }),
    Confirm: { ...actual.Confirm, warning: vi.fn(() => Promise.resolve()) },
  };
});

const detail = (): ResourceDetail<MemberRecord> => ({
  record: {
    id: "1001",
    username: "alice",
    displayName: "成员",
    avatar: "avatar.png",
    phone: "***",
    status: MemberStatus.ACTIVE,
    departments: [],
  },
  fieldAccess: {
    joinedAt: { visibility: FieldVisibility.FULL, editable: false },
    lastLoginAt: { visibility: FieldVisibility.FULL, editable: false },
    updatedAt: { visibility: FieldVisibility.FULL, editable: false },
    displayName: { visibility: FieldVisibility.FULL, editable: false },
    avatar: { visibility: FieldVisibility.FULL, editable: true },
    phone: { visibility: FieldVisibility.MASKED, editable: false },
    email: { visibility: FieldVisibility.HIDDEN, editable: false },
  },
  capabilities: { [IamAction.PLATFORM_MEMBER_UPDATE]: { allowed: true } },
  version: "0",
});
const panel = defineComponent({
  props: ["editable", "name"],
  setup(props, { slots }) {
    return () =>
      h("section", { "data-editable": props.editable, "data-name": props.name }, slots.default?.());
  },
});
const field = defineComponent({
  props: ["label", "value"],
  setup(props, { slots }) {
    return () =>
      h("div", { "data-label": props.label }, [
        String(props.value ?? ""),
        slots.default?.(),
        slots.view?.(),
      ]);
  },
});
const drawer = defineComponent({
  emits: ["edit", "save"],
  setup(_, { slots, emit }) {
    return () =>
      h("div", [
        slots.identity?.(),
        slots.default?.(),
        h("button", { class: "edit", onClick: () => emit("edit") }, "编辑"),
        h("button", { class: "save", onClick: () => emit("save") }, "保存"),
      ]);
  },
});
const input = defineComponent({
  props: ["modelValue", "disabled"],
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        value: props.modelValue,
        disabled: props.disabled,
        onInput: (event: Event) =>
          emit("update:modelValue", (event.target as HTMLInputElement).value),
      });
  },
});
const open = async (row: ResourceDetail<MemberRecord>) => {
  api.detail.mockResolvedValue({ data: row });
  const wrapper = mount(MemberDetailDrawer, {
    global: {
      stubs: {
        InDetailDrawer: drawer,
        InDetailIdentity: true,
        InBizTabPanel: panel,
        InForm: { template: "<div><slot /></div>" },
        InDetailField: field,
        ElInput: input,
        ElFormItem: { template: "<div><slot /></div>" },
        StatusTag: true,
        MemberRolesField: defineComponent({
          emits: ["update:draft"],
          setup(_, { emit, expose }) {
            expose({ refresh: vi.fn(() => Promise.resolve()) });
            return () =>
              h(
                "button",
                {
                  class: "roles",
                  onClick: () =>
                    emit("update:draft", {
                      stored: [],
                      roles: [
                        {
                          option: {
                            id: "31",
                            name: "测试",
                            roleRevisionRef: { kind: "PLATFORM_CUSTOM", id: "31" },
                            roleNode: { roleId: "24" },
                          },
                          bindings: {},
                          selectedObjects: {},
                        },
                      ],
                      removed: [],
                    }),
                },
                "配置角色",
              );
          },
        }),
      },
    },
  });
  (wrapper.vm as unknown as { show: (row: ResourceDetail<MemberRecord>) => void }).show(row);
  await flushPromises();
  return wrapper;
};
beforeEach(() => {
  vi.clearAllMocks();
  api.rolesAllowed = false;
});
describe("成员详情字段界面", () => {
  it.each([
    ["Asia/Shanghai", "2026-10-08 09:02:03"],
    ["America/New_York", "2026-10-07 21:02:03"],
  ])("其他分组按 %s 展示只读时间", async (timeZone, expected) => {
    const options = new Intl.DateTimeFormat().resolvedOptions();
    const zone = vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions");
    zone.mockReturnValue({ ...options, timeZone });
    const row = detail();
    row.record.joinedAt = "2026-10-08T01:02:03Z";
    row.record.lastLoginAt = row.record.joinedAt;
    row.record.updatedAt = row.record.joinedAt;
    const wrapper = await open(row);
    try {
      const other = wrapper.get('[data-name="other"]');
      for (const label of ["加入平台时间", "账号最后登录时间", "成员更新时间"]) {
        expect(other.get(`[data-label="${label}"]`).text()).toBe(expected);
      }
      expect(other.text()).toContain("包含平台及组织身份登录");
      expect(other.find("input").exists()).toBe(false);
      expect(other.attributes("data-editable")).toBe("false");
      expect(row.record.joinedAt).toBe("2026-10-08T01:02:03Z");
    } finally {
      wrapper.unmount();
      zone.mockRestore();
    }
  });
  it("隐藏邮箱标签，读态显示脱敏手机号，编辑草稿为空且禁用", async () => {
    const wrapper = await open(detail());
    expect(wrapper.find('[data-label="联系邮箱"]').exists()).toBe(false);
    expect(wrapper.get('[data-label="联系手机号"]').text()).toContain("***");
    expect(wrapper.get('[data-label="加入平台时间"]').text()).toBe("-");
    expect(wrapper.get('[data-label="成员更新时间"]').text()).toBe("-");
    expect(wrapper.get('[data-label="账号最后登录时间"]').text()).toBe("暂无登录记录");
    await wrapper.get("button.edit").trigger("click");
    const phone = wrapper.get('[data-label="联系手机号"] input');
    expect((phone.element as HTMLInputElement).value).toBe("");
    expect(phone.attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-label="显示名"] input').attributes("disabled")).toBeDefined();
    await wrapper.get("button.save").trigger("click");
    expect(api.update).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it("脱敏且可编辑的手机号留空不提交，实际输入后只提交手机号", async () => {
    const row = detail();
    row.fieldAccess.phone = { visibility: FieldVisibility.MASKED, editable: true };
    api.update.mockResolvedValue({ data: row });
    const wrapper = await open(row);
    await wrapper.get("button.edit").trigger("click");
    const phone = wrapper.get('[data-label="联系手机号"] input');
    expect((phone.element as HTMLInputElement).value).toBe("");
    expect(phone.attributes("disabled")).toBeUndefined();
    await wrapper.get("button.save").trigger("click");
    expect(api.update).not.toHaveBeenCalled();
    await phone.setValue("13900000002");
    await wrapper.get("button.save").trigger("click");
    await flushPromises();
    expect(api.update).toHaveBeenCalledWith("1001", { expectedVersion: "0", phone: "13900000002" });
    wrapper.unmount();
  });
  it("对象范围不允许更新时基本信息面板不可编辑，模拟编辑保存不发请求", async () => {
    const row = detail();
    row.capabilities[IamAction.PLATFORM_MEMBER_UPDATE] = { allowed: false };
    const wrapper = await open(row);
    expect(wrapper.get('[data-name="basic"]').attributes("data-editable")).toBe("false");
    await wrapper.get("button.edit").trigger("click");
    await wrapper.get("button.save").trigger("click");
    expect(api.update).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it("资料全部只读时仍可按直接分配资格编辑角色，最终预览后一次保存", async () => {
    api.rolesAllowed = true;
    const row = detail();
    row.record.joinedAt = "2026-10-01T01:00:00Z";
    row.record.lastLoginAt = "2026-10-08T02:00:00Z";
    row.record.updatedAt = "2026-10-08T03:00:00Z";
    Object.values(row.fieldAccess).forEach((field) => {
      field.editable = false;
    });
    api.preview.mockResolvedValue({
      data: { valid: true, errors: [], effectiveResult: { additions: 1, updates: 0, removals: 0 } },
    });
    const updatedAt = "2026-10-08T04:00:00Z";
    api.update.mockResolvedValue({
      data: { ...row, record: { ...row.record, updatedAt }, version: "1" },
    });
    const wrapper = await open(row);
    expect(wrapper.get('[data-name="basic"]').attributes("data-editable")).toBe("true");
    await wrapper.get("button.edit").trigger("click");
    await wrapper.get("button.roles").trigger("click");
    expect(api.update).not.toHaveBeenCalled();
    await wrapper.get("button.save").trigger("click");
    await flushPromises();
    expect(api.preview).toHaveBeenCalledTimes(1);
    expect(api.update).toHaveBeenCalledWith("1001", {
      expectedVersion: "0",
      roleChanges: {
        additions: [
          {
            roleId: "24",
            roleRevisionRef: { kind: "PLATFORM_CUSTOM", id: "31" },
            scopeBindings: {},
            validFrom: undefined,
            validUntil: undefined,
          },
        ],
        updates: [],
        removals: [],
      },
    });
    expect(wrapper.get('[data-label="成员更新时间"]').text()).toBe(formatDateTime(updatedAt));
    wrapper.unmount();
  });
  it("角色预览未通过则不提交成员，保留草稿供重新配置", async () => {
    api.rolesAllowed = true;
    api.preview.mockResolvedValue({
      data: { valid: false, errors: [{ message: "对象范围已变化" }] },
    });
    const wrapper = await open(detail());
    await wrapper.get("button.edit").trigger("click");
    await wrapper.get("button.roles").trigger("click");
    await wrapper.get("button.save").trigger("click");
    await flushPromises();
    expect(api.update).not.toHaveBeenCalled();
    expect(api.preview).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});
