import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, usePermissions } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  AuthorizationDomain,
  FieldVisibility,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  type FieldAccessMap,
} from "@ingot/admin-common";
import BizPlatformAccountSelect from "../../components/BizPlatformAccountSelect.vue";
import MemberCreateDrawer from "./MemberCreateDrawer.vue";

const api = vi.hoisted(() => ({
  context: vi.fn(),
  page: vi.fn(),
  lookup: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/api/iam/personnel", () => ({
  PlatformMemberContextAPI: api.context,
  PlatformMemberCreateAPI: api.create,
}));
vi.mock("@/api/iam/accounts", () => ({
  PlatformAccountLookupAPI: api.lookup,
  PlatformAccountPageAPI: api.page,
}));
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
const pickerStubs = {
  InSelectionField: {
    props: ["placeholder", "items", "disabled"],
    template:
      '<button data-picker :disabled="disabled">{{ items[0]?.name || placeholder }}</button>',
  },
  InDialog: {
    props: ["modelValue"],
    template: '<div v-if="modelValue" role="dialog"><slot /><slot name="footer" /></div>',
  },
  InLoading: { template: "<div><slot /></div>" },
  InAvatar: true,
  InCloseButton: {
    props: ["label"],
    template: '<button type="button" :aria-label="label" />',
  },
  ElInput: input,
  InButton: button,
  ElPagination: {
    props: ["currentPage", "disabled"],
    emits: ["current-change"],
    template:
      '<button :disabled="disabled" @click="$emit(\'current-change\', currentPage + 1)">下一页</button>',
  },
  ElRadio: {
    props: ["value", "modelValue"],
    emits: ["update:modelValue"],
    template: `
      <label>
        <input type="radio" :checked="modelValue === value" @change="$emit('update:modelValue', value)" />
        <slot />
      </label>
    `,
  },
};
const findButton = (wrapper: VueWrapper, label: string) =>
  wrapper.findAll("button").find((item) => item.text() === label)!;
const clickButton = (wrapper: VueWrapper, label: string) =>
  findButton(wrapper, label).trigger("click");
const selectedPanel = (wrapper: VueWrapper) => wrapper.get('section[aria-label="已选账号"]');
const candidatesPanel = (wrapper: VueWrapper) => wrapper.get('section[aria-label="候选账号"]');
const search = async (wrapper: VueWrapper, username: string) => {
  await wrapper.get('input[aria-label="登录名"]').setValue(username);
  await clickButton(wrapper, "查询");
  await flushPromises();
};
const lookupResult = {
  data: {
    record: { id: "2", username: "bob", phone: "***" },
    fieldAccess: fields,
    capabilities: {},
    version: "0",
  },
};
const pageResult = (
  current: number,
  records: (typeof lookupResult.data)[],
  total = records.length,
) => ({
  data: { current, size: IAM_DEFAULT_PAGE_SIZE, total, records },
});
beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  usePermissions().permissions = [
    IamAction.PLATFORM_ACCOUNT_READ,
    IamAction.PLATFORM_ACCOUNT_LOOKUP,
  ];
  api.page.mockResolvedValue(pageResult(1, []));
  api.context.mockResolvedValue({
    data: { listFieldVisibility: {}, createFieldAccess: fields, canSearchDisplayName: false },
  });
  api.lookup.mockResolvedValue(lookupResult);
  api.create.mockResolvedValue({ data: { id: "2001", version: "0" } });
});
describe("成员创建字段界面", () => {
  it("隐藏邮箱、只读显示名采用系统默认；提交不携带不可写字段或脱敏占位", async () => {
    api.page.mockResolvedValueOnce(
      pageResult(1, [
        {
          ...lookupResult.data,
          fieldAccess: {},
          record: { ...lookupResult.data.record, phone: "全局账号列表的资料" },
        },
      ]),
    );
    const wrapper = mount(MemberCreateDrawer, {
      global: {
        stubs: {
          ...pickerStubs,
          InDrawer: { template: "<div><slot /><slot name='footer' /></div>" },
          InForm: { template: "<div><slot /></div>" },
          ElFormItem: defineComponent({
            props: ["label"],
            setup(props, { slots }) {
              return () => h("div", { "data-label": props.label }, slots.default?.());
            },
          }),
          InCommonUploadAvatar: true,
          MemberRoleAssignDialog: true,
          BizIamMemberPickerDialog: true,
        },
      },
    });
    (wrapper.vm as unknown as { show: () => void }).show();
    await flushPromises();
    await wrapper.get("[data-picker]").trigger("click");
    await flushPromises();
    expect(api.page.mock.calls[0][1]).toEqual({ excludePlatformMembers: true });
    expect(api.lookup).not.toHaveBeenCalled();
    expect(wrapper.find('[data-label="显示名"]').exists()).toBe(false);
    await wrapper.get('input[type="radio"]').setValue(true);
    await flushPromises();
    expect(api.lookup.mock.calls[0][0]).toEqual({
      purpose: AccountLookupPurpose.MEMBER_CREATE,
      domain: AuthorizationDomain.PLATFORM,
      username: "bob",
    });
    expect(selectedPanel(wrapper).text()).toContain("bob");
    expect(wrapper.get("[data-picker]").text()).toBe("请选择全局账号");
    await clickButton(wrapper, "确定");
    expect(wrapper.get("[data-picker]").text()).toBe("bob");
    expect(wrapper.get<HTMLInputElement>('[data-label="初始联系手机号"] input').element.value).toBe(
      "***",
    );
    expect(wrapper.find('[data-label="初始联系邮箱"]').exists()).toBe(false);
    expect(wrapper.get('[data-label="显示名"]').text()).toContain("由系统设置默认显示名");
    expect(wrapper.get('[data-label="显示名"]').find("input").exists()).toBe(false);
    await clickButton(wrapper, "跳过并添加");
    await flushPromises();
    expect(api.create).toHaveBeenCalledTimes(1);
    const payload = api.create.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.accountId).toBe("2");
    for (const key of ["displayName", "phone", "email"]) expect(payload).not.toHaveProperty(key);
    wrapper.unmount();
  });
});

describe("全局账号选择", () => {
  it("打开即取第一页，翻页保留已选，清空精确筛选后回到第一页", async () => {
    const wrapper = mount(BizPlatformAccountSelect, {
      props: { modelValue: lookupResult.data },
      global: { stubs: pickerStubs },
    });
    const alice = {
      ...lookupResult.data,
      record: { ...lookupResult.data.record, id: "3", username: "alice" },
    };
    api.page
      .mockResolvedValueOnce(pageResult(1, [lookupResult.data], 21))
      .mockResolvedValueOnce(pageResult(2, [alice], 21))
      .mockResolvedValueOnce(pageResult(1, [lookupResult.data], 21));
    await wrapper.get("[data-picker]").trigger("click");
    await flushPromises();
    expect(candidatesPanel(wrapper).text()).toContain("bob");
    expect(api.page.mock.calls[0][0]).toEqual({ current: 1, size: 20 });
    expect(api.page.mock.calls[0][1]).toBeUndefined();

    await clickButton(wrapper, "下一页");
    await flushPromises();
    expect(candidatesPanel(wrapper).text()).toContain("alice");
    expect(selectedPanel(wrapper).text()).toContain("bob");
    expect(api.page.mock.calls[1][0]).toEqual({ current: 2, size: 20 });

    api.lookup.mockResolvedValueOnce({ data: alice });
    await search(wrapper, " alice ");
    expect(api.lookup.mock.calls[0][0]).toEqual({
      purpose: AccountLookupPurpose.MEMBER_CREATE,
      username: "alice",
    });
    expect(wrapper.findComponent({ name: "ElPagination" }).exists()).toBe(false);
    await wrapper.get('input[aria-label="登录名"]').setValue("");
    await flushPromises();
    expect(candidatesPanel(wrapper).text()).toContain("bob");
    expect(selectedPanel(wrapper).text()).toContain("bob");
    expect(api.page.mock.calls.map(([page]) => page.current)).toEqual([1, 2, 1]);
    wrapper.unmount();
  });

  it("候选加载后已加入平台的账号无法选中，并提示原因", async () => {
    const wrapper = mount(BizPlatformAccountSelect, {
      props: { forPlatformMember: true },
      global: { stubs: pickerStubs },
    });
    api.page.mockResolvedValueOnce(pageResult(1, [lookupResult.data]));
    api.lookup.mockRejectedValueOnce(
      new ApiError({ kind: "business", code: "InvalidArgument", message: "该账号已是平台成员" }),
    );
    await wrapper.get("[data-picker]").trigger("click");
    await flushPromises();
    await wrapper.get('input[type="radio"]').setValue(true);
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("该账号已是平台成员");
    expect(selectedPanel(wrapper).text()).toContain("已选：0 个账号");
    expect(findButton(wrapper, "确定").element.disabled).toBe(true);
    wrapper.unmount();
  });

  it("所有者查询省略平台成员域，取消替换时保留已选并丢弃迟到结果", async () => {
    usePermissions().permissions = [IamAction.PLATFORM_ACCOUNT_LOOKUP];
    const wrapper = mount(BizPlatformAccountSelect, {
      props: { modelValue: lookupResult.data, placeholder: "请选择所有者账号" },
      global: { stubs: pickerStubs },
    });
    await wrapper.get("[data-picker]").trigger("click");
    expect(api.page).not.toHaveBeenCalled();
    expect(selectedPanel(wrapper).text()).toContain("bob");
    let finishLookup: (value: typeof lookupResult) => void = () => undefined;
    api.lookup.mockReturnValueOnce(
      new Promise<typeof lookupResult>((resolve) => {
        finishLookup = resolve;
      }),
    );
    await search(wrapper, "alice");
    expect(api.lookup.mock.calls[0][0]).toEqual({
      purpose: AccountLookupPurpose.MEMBER_CREATE,
      username: "alice",
    });
    await clickButton(wrapper, "取消");
    expect(api.lookup.mock.calls[0][1].signal.aborted).toBe(true);
    finishLookup({
      data: { ...lookupResult.data, record: { id: "3", username: "alice", phone: "***" } },
    });
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.get("[data-picker]").text()).toBe("bob");
    await wrapper.get("[data-picker]").trigger("click");
    expect(selectedPanel(wrapper).text()).toContain("bob");
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("右栏保留已选，选中另一条候选时替换，移除或清空后须重新选择", async () => {
    const wrapper = mount(BizPlatformAccountSelect, {
      props: { modelValue: lookupResult.data },
      global: { stubs: pickerStubs },
    });
    const alice = {
      ...lookupResult.data,
      record: { ...lookupResult.data.record, id: "3", username: "alice" },
    };
    api.lookup.mockResolvedValueOnce({ data: alice });
    await wrapper.get("[data-picker]").trigger("click");
    await search(wrapper, "alice");
    expect(selectedPanel(wrapper).text()).toContain("bob");

    await wrapper.get('input[type="radio"]').setValue(true);
    expect(selectedPanel(wrapper).text()).toContain("已选：1 个账号");
    expect(selectedPanel(wrapper).text()).toContain("alice");
    expect(selectedPanel(wrapper).text()).not.toContain("bob");
    await wrapper.get('button[aria-label="移除 alice"]').trigger("click");
    expect(findButton(wrapper, "确定").element.disabled).toBe(true);

    await wrapper.get('input[type="radio"]').setValue(true);
    await clickButton(wrapper, "清空");
    expect(selectedPanel(wrapper).text()).toContain("已选：0 个账号");
    expect(findButton(wrapper, "确定").element.disabled).toBe(true);
    await wrapper.get('input[type="radio"]').setValue(true);
    await clickButton(wrapper, "确定");
    expect(wrapper.emitted("update:modelValue")).toEqual([[alice]]);
    wrapper.unmount();
  });

  it("展示已有成员提示，未命中时提供创建全局账号入口", async () => {
    const wrapper = mount(BizPlatformAccountSelect, {
      props: { forPlatformMember: true },
      global: { stubs: pickerStubs },
    });
    await wrapper.get("[data-picker]").trigger("click");
    api.lookup.mockRejectedValueOnce(
      new ApiError({ kind: "business", code: "InvalidArgument", message: "该账号已是平台成员" }),
    );
    await search(wrapper, "bob");
    expect(wrapper.get('[role="status"]').text()).toBe("该账号已是平台成员");
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false);

    api.lookup.mockRejectedValueOnce(
      new ApiError({ kind: "business", code: "ObjectNotFound", message: "账号不存在" }),
    );
    await search(wrapper, " alice ");
    expect(wrapper.get('[role="status"]').text()).toContain("未找到该登录名");
    await clickButton(wrapper, "前往创建全局账号");
    expect(wrapper.emitted("create-account")).toEqual([["alice"]]);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    wrapper.unmount();
  });
});
