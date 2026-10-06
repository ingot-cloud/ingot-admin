import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FieldVisibility, type FieldAccessMap } from "@ingot/admin-common";
import MemberCreateDrawer from "./MemberCreateDrawer.vue";

const api = vi.hoisted(() => ({ context: vi.fn(), lookup: vi.fn(), create: vi.fn() }));
vi.mock("@/api/iam/personnel", () => ({
  PlatformMemberContextAPI: api.context,
  PlatformMemberCreateAPI: api.create,
}));
vi.mock("@/api/iam/accounts", () => ({ PlatformAccountLookupAPI: api.lookup }));
vi.mock("@/api/iam/personnel.query", () => ({
  platformMemberQueryKeys: { lists: () => ["member", "list"] },
}));
vi.mock("../iamMemberOptions", () => ({ loadPlatformGroupOptions: vi.fn() }));
vi.mock("../useDirectRoleEligibility", () => ({
  useDirectRoleEligibility: () => ({ canGrantDirect: ref(false), refresh: vi.fn() }),
}));
vi.mock("@tanstack/vue-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return { ...actual, useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) };
});
const fields: FieldAccessMap = {
  displayName: { visibility: FieldVisibility.FULL, editable: false },
  avatar: { visibility: FieldVisibility.FULL, editable: true },
  phone: { visibility: FieldVisibility.MASKED, editable: false },
  email: { visibility: FieldVisibility.HIDDEN, editable: false },
};
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
const button = defineComponent({
  props: ["disabled"],
  emits: ["click", "in-click"],
  setup(props, { slots, emit }) {
    return () =>
      h(
        "button",
        {
          disabled: props.disabled,
          onClick: () => {
            emit("click");
            emit("in-click");
          },
        },
        slots.default?.(),
      );
  },
});
beforeEach(() => {
  vi.clearAllMocks();
  api.context.mockResolvedValue({
    data: { listFieldVisibility: {}, createFieldAccess: fields, canSearchDisplayName: false },
  });
  api.lookup.mockResolvedValue({
    data: { record: { id: "2", username: "bob", phone: "***" }, fieldAccess: fields },
  });
  api.create.mockResolvedValue({ data: { id: "2001", version: "0" } });
});
describe("成员创建字段界面", () => {
  it("隐藏邮箱、只读显示名采用系统默认；提交不携带不可写字段或脱敏占位", async () => {
    const wrapper = mount(MemberCreateDrawer, {
      global: {
        stubs: {
          InDrawer: { template: "<div><slot /><slot name='footer' /></div>" },
          InForm: { template: "<div><slot /></div>" },
          ElFormItem: defineComponent({
            props: ["label"],
            setup(props, { slots }) {
              return () => h("div", { "data-label": props.label }, slots.default?.());
            },
          }),
          ElInput: input,
          InButton: button,
          InCommonUploadAvatar: true,
          MemberRoleAssignDialog: true,
          BizIamMemberPickerDialog: true,
        },
      },
    });
    (wrapper.vm as unknown as { show: () => void }).show();
    await flushPromises();
    await wrapper.get("input").setValue("bob");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "查找")!
      .trigger("click");
    await flushPromises();
    expect(wrapper.find('[data-label="初始联系邮箱"]').exists()).toBe(false);
    expect(wrapper.get('[data-label="显示名"]').text()).toContain("由系统设置默认显示名");
    expect(wrapper.get('[data-label="显示名"]').find("input").exists()).toBe(false);
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "跳过并添加")!
      .trigger("click");
    await flushPromises();
    expect(api.create).toHaveBeenCalledTimes(1);
    const payload = api.create.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.accountId).toBe("2");
    for (const key of ["displayName", "phone", "email"]) expect(payload).not.toHaveProperty(key);
    wrapper.unmount();
  });
});
