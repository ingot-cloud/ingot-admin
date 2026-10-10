import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  AuthorizationDomain,
  FieldVisibility,
  MaskKind,
  ScopeKind,
  type FieldCapability,
  type ResourceDetail,
  type AppResourceRecord,
} from "@ingot/admin-common";
import ResourceEditDrawer from "./ResourceEditDrawer.vue";
import ResourceFieldDialog from "./ResourceFieldDialog.vue";
import ResourceFieldList from "./ResourceFieldList.vue";
import { cloneResourceField, resourceFieldBinding, resourceFieldErrors } from "./resourceFields";
import { PlatformResourceBindingsAPI, PlatformResourceUpdateAPI } from "@/api/iam/catalog";

vi.mock("@/api/iam/catalog", () => ({
  PlatformResourceCreateAPI: vi.fn(async () => ({})),
  PlatformResourceUpdateAPI: vi.fn(async () => ({})),
  PlatformResourceBindingsAPI: vi.fn(async () => ({ data: { bindings: [] } })),
}));
vi.mock("@ingot/admin-core", async (original) => ({
  ...(await original<object>()),
  Message: { warning: vi.fn(), success: vi.fn() },
}));
const field = (): FieldCapability => ({
  key: "phone",
  label: "手机号",
  visibilities: [FieldVisibility.MASKED, FieldVisibility.FULL],
  editable: true,
  filterable: false,
  mask: { kind: MaskKind.KEEP_EDGES, prefix: 1, suffix: 1 },
});
const target = (): ResourceDetail<AppResourceRecord> =>
  ({
    version: "3",
    record: {
      id: "100",
      applicationId: "1",
      code: "member",
      name: "成员",
      scopeCapabilities: [ScopeKind.ALL],
      fieldCapabilities: [field()],
    },
  }) as ResourceDetail<AppResourceRecord>;
const stubs = {
  InDrawer: {
    props: ["modelValue", "title"],
    template:
      '<section v-if="modelValue"><slot /><footer><slot name="footer" /></footer></section>',
  },
  InDialog: {
    props: ["modelValue", "title"],
    template:
      '<section v-if="modelValue"><h2>{{ title }}</h2><slot /><footer><slot name="footer" /></footer></section>',
  },
  InForm: { template: "<div><slot /></div>" },
  ElFormItem: {
    props: ["label", "error"],
    template:
      '<div :data-label="label"><slot /><span v-if="error" role="alert">{{ error }}</span></div>',
  },
  InButton: {
    emits: ["click", "in-click"],
    template: "<button @click=\"$emit('click'); $emit('in-click')\"><slot /></button>",
  },
};
const show = (wrapper: ReturnType<typeof mount>, value?: ResourceDetail<AppResourceRecord>) =>
  (
    wrapper.vm as unknown as {
      show: (id: string, target?: ResourceDetail<AppResourceRecord>) => void;
    }
  ).show("1", value);
const clickText = async (wrapper: ReturnType<typeof mount>, text: string) => {
  await wrapper
    .findAll("button")
    .find((button) => button.text() === text)
    ?.trigger("click");
  await flushPromises();
};

beforeEach(() => vi.clearAllMocks());
describe("资源字段独立草稿", () => {
  it("添加立即打开弹窗，取消不会追加字段，确认只改草稿，资源保存统一提交", async () => {
    const submit = vi.fn();
    const wrapper = mount(ResourceEditDrawer, {
      props: { domain: AuthorizationDomain.PLATFORM, submit },
      global: { stubs },
    });
    show(wrapper, target());
    await flushPromises();
    await clickText(wrapper, "添加字段");
    expect(wrapper.getComponent(ResourceFieldDialog).text()).toContain("添加字段");
    await clickText(wrapper.getComponent(ResourceFieldDialog), "取消");
    expect(wrapper.getComponent(ResourceFieldList).props("fields")).toHaveLength(1);
    await clickText(wrapper, "添加字段");
    const dialog = wrapper.getComponent(ResourceFieldDialog);
    await dialog.get('[data-label="字段键"] input').setValue(" joinedAt ");
    await dialog.get('[data-label="展示名"] input').setValue(" 加入时间 ");
    await clickText(dialog, "添加");
    expect(wrapper.getComponent(ResourceFieldList).props("fields")).toHaveLength(2);
    expect(wrapper.getComponent(ResourceFieldList).text()).toContain("joinedAt");
    expect(submit).not.toHaveBeenCalled();
    expect(PlatformResourceUpdateAPI).not.toHaveBeenCalled();
    await clickText(wrapper, "保存");
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0].fieldCapabilities[1]).toMatchObject({
      key: "joinedAt",
      label: "加入时间",
    });
    expect(PlatformResourceBindingsAPI).not.toHaveBeenCalled();
  });
  it("应用创建向导中的未持久化字段允许修改逻辑键", async () => {
    const wrapper = mount(ResourceEditDrawer, {
      props: { domain: AuthorizationDomain.PLATFORM, submit: vi.fn() },
      global: { stubs },
    });
    show(wrapper, target());
    await flushPromises();
    await clickText(wrapper, "编辑");
    const dialog = wrapper.getComponent(ResourceFieldDialog);
    expect(dialog.get('[data-label="字段键"] input').attributes("disabled")).toBeUndefined();
    await dialog.get('[data-label="字段键"] input').setValue("contactPhone");
    await clickText(dialog, "确认");
    expect(wrapper.getComponent(ResourceFieldList).props("fields")[0].key).toBe("contactPhone");
  });
  it("重复打开同一资源时，旧接入响应不能覆盖当前状态", async () => {
    let finishOld!: (response: Awaited<ReturnType<typeof PlatformResourceBindingsAPI>>) => void;
    vi.mocked(PlatformResourceBindingsAPI).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        }),
    );
    const wrapper = mount(ResourceEditDrawer, {
      props: { domain: AuthorizationDomain.PLATFORM },
      global: { stubs },
    });
    show(wrapper, target());
    show(wrapper, target());
    await flushPromises();
    expect(wrapper.getComponent(ResourceFieldList).text()).toContain("未接入");
    finishOld({
      data: {
        bindings: [
          { fieldKey: "phone", use: "READ", textual: true },
          { fieldKey: "phone", use: "WRITE" },
        ],
      },
    } as Awaited<ReturnType<typeof PlatformResourceBindingsAPI>>);
    await flushPromises();
    expect(wrapper.getComponent(ResourceFieldList).text()).toContain("未接入");
    expect(wrapper.getComponent(ResourceFieldList).text()).not.toContain("已接入：");
  });
  it("编辑脱敏参数后取消，不修改资源或接口返回对象；已保存的键只读", async () => {
    const original = target();
    const wrapper = mount(ResourceEditDrawer, {
      props: { domain: AuthorizationDomain.PLATFORM },
      global: { stubs },
    });
    show(wrapper, original);
    await flushPromises();
    await clickText(wrapper, "编辑");
    const dialog = wrapper.getComponent(ResourceFieldDialog);
    expect(dialog.get('[data-label="字段键"] input').attributes("disabled")).toBeDefined();
    const number = dialog.findAllComponents({ name: "ElInputNumber" })[0];
    number.vm.$emit("update:modelValue", 4);
    await flushPromises();
    await clickText(dialog, "取消");
    expect(original.record.fieldCapabilities[0].mask?.prefix).toBe(1);
    expect(wrapper.getComponent(ResourceFieldList).props("fields")[0].mask.prefix).toBe(1);
    await clickText(wrapper, "保存");
    expect(PlatformResourceUpdateAPI).toHaveBeenCalledWith(
      "1",
      "100",
      expect.objectContaining({
        expectedVersion: "3",
        fieldCapabilities: [original.record.fieldCapabilities[0]],
      }),
    );
  });
  it("重复字段键拒绝确认，未绑定字段允许配置", async () => {
    const wrapper = mount(ResourceEditDrawer, {
      props: { domain: AuthorizationDomain.PLATFORM, submit: vi.fn() },
      global: { stubs },
    });
    show(wrapper, target());
    await flushPromises();
    await clickText(wrapper, "添加字段");
    const dialog = wrapper.getComponent(ResourceFieldDialog);
    await dialog.get('[data-label="字段键"] input').setValue(" phone ");
    await dialog.get('[data-label="展示名"] input').setValue("电话");
    await clickText(dialog, "添加");
    expect(dialog.text()).toContain("字段键已存在");
    expect(wrapper.getComponent(ResourceFieldList).props("fields")).toHaveLength(1);
    expect(resourceFieldErrors({ ...field(), key: "custom" }, [])).toEqual({});
  });
  it("在搜索结果中新增字段，确认后清空搜索并定位字段", async () => {
    const wrapper = mount(ResourceFieldList, {
      props: { fields: [field()], checkable: false, bindingError: false },
      global: { stubs },
    });
    await wrapper.get("input").setValue("notfound");
    expect(wrapper.text()).toContain("没有匹配的字段");
    const added = { ...field(), key: "email", label: "邮箱" };
    await wrapper.setProps({ fields: [field(), added] });
    await (wrapper.vm as unknown as { locate: (key: string) => Promise<void> }).locate("email");
    expect(wrapper.get("input").element.value).toBe("");
    expect(wrapper.get(".is-highlighted").text()).toContain("邮箱");
  });
  it("接入状态区分部分接入、未接入和失败，不将配置冒充已实现", () => {
    const manifest = {
      resource: {
        domain: AuthorizationDomain.PLATFORM,
        applicationCode: "iam",
        resourceCode: "member",
      },
      version: "1",
      bindings: [
        {
          actionCode: "detail",
          use: "READ" as const,
          valueType: "String",
          property: "phone",
          fieldKey: "phone",
          textual: true,
        },
      ],
    };
    expect(resourceFieldBinding(field(), true, manifest)).toMatchObject({
      label: "部分接入",
      detail: "已接入：可见性；待接入：编辑",
    });
    expect(resourceFieldBinding(field(), true, { ...manifest, bindings: [] }).label).toBe("未接入");
    expect(resourceFieldBinding(field(), true, undefined, true).label).toBe("读取失败");
    expect(
      resourceFieldErrors(field(), [], {
        ...manifest,
        bindings: [{ ...manifest.bindings[0], textual: false }],
      }).visibilities,
    ).toBeDefined();
    const original = field();
    const cloned = cloneResourceField(original);
    cloned.mask!.prefix = 10;
    expect(original.mask!.prefix).toBe(1);
  });
});
