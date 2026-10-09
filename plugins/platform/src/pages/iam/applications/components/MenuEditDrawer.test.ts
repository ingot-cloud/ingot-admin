import { beforeEach, describe, expect, it, vi } from "vitest";
import { shallowMount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { ApiError } from "@ingot/http-client";
import MenuEditDrawer from "./MenuEditDrawer.vue";
import {
  MenuKind,
  MenuAccessMode,
  MenuMatchMode,
  ConfigurationStatus,
  type MenuTreeRow,
  type AppMenuDraft,
} from "@ingot/admin-common";

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  update: vi.fn(),
  reload: vi.fn(),
  refresh: vi.fn(),
  warning: vi.fn(),
}));
vi.mock("@ingot/admin-core", async (original) => ({
  ...(await original<typeof import("@ingot/admin-core")>()),
  confirmUnsavedChanges: mocks.confirm,
  refreshSessionMenus: mocks.refresh,
  useCapabilities: () => ({ hasAction: () => true }),
  Message: { success: vi.fn(), warning: mocks.warning },
}));
vi.mock("@/api/iam/catalog", () => ({
  PlatformMenuCreateAPI: vi.fn(),
  PlatformMenuUpdateAPI: mocks.update,
  PlatformMenuTreeAPI: mocks.reload,
}));
vi.mock("../viewPaths", () => ({ viewPathOptionGroups: () => [] }));
vi.mock("../applicationCatalog", () => ({
  loadApplicationCatalog: vi.fn(),
  loadMenuAssociatedActions: vi.fn(),
}));
const Box = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h("div", [slots.default?.(), slots.footer?.()]),
});
const Drawer = defineComponent({
  props: ["modelValue", "size", "title"],
  setup:
    (props, { slots }) =>
    () =>
      props.modelValue
        ? h("div", { "data-size": props.size, "data-title": props.title }, [
            slots.default?.(),
            slots.footer?.(),
          ])
        : null,
});
const Button = defineComponent({
  props: ["disabled"],
  emits: ["click", "in-click"],
  setup:
    (props, { emit, slots }) =>
    () =>
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
      ),
});
const Input = defineComponent({
  props: ["modelValue", "placeholder"],
  emits: ["update:modelValue"],
  setup:
    (props, { emit }) =>
    () =>
      h("input", {
        placeholder: props.placeholder,
        value: props.modelValue,
        onInput: (e: Event) => emit("update:modelValue", (e.target as HTMLInputElement).value),
      }),
});
const Switch = defineComponent({
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup:
    (props, { emit }) =>
    () =>
      h("input", {
        type: "checkbox",
        checked: props.modelValue,
        onChange: (e: Event) => emit("update:modelValue", (e.target as HTMLInputElement).checked),
      }),
});
const Tabs = defineComponent({
  name: "InBizTabs",
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup:
    (_, { slots }) =>
    () =>
      h("div", slots.default?.()),
});
const Nav = defineComponent({
  name: "BizIamWizardNav",
  props: ["current", "interactive"],
  emits: ["change"],
  setup: () => () => h("aside"),
});
const row: MenuTreeRow = {
  record: {
    id: "1",
    applicationId: "app",
    name: "详情",
    kind: MenuKind.PAGE,
    path: "/orders",
    viewPath: "orders.detail",
    accessMode: MenuAccessMode.OPEN,
    matchMode: MenuMatchMode.ANY,
    actionIds: [],
    sortOrder: 0,
    status: ConfigurationStatus.ENABLED,
    hidden: true,
    props: true,
    isCache: true,
    routeParams: [{ name: "a", remark: "编号" }],
  },
  children: [],
  fieldAccess: {},
  capabilities: {},
  version: "0",
};
function fixture(submit?: (draft: AppMenuDraft, target?: MenuTreeRow) => void | Promise<void>) {
  return shallowMount(MenuEditDrawer, {
    props: { submit },
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        InDrawer: Drawer,
        InButton: Button,
        InForm: Box,
        InBizTabs: Tabs,
        InBizTabPanel: Box,
        ElFormItem: Box,
        ElInput: Input,
        ElSwitch: Switch,
        WizardNav: Nav,
      },
    },
  });
}
async function click(wrapper: ReturnType<typeof fixture>, text: string) {
  const button = wrapper.findAll("button").find((b) => b.text() === text);
  expect(button).toBeDefined();
  await button!.trigger("click");
  await flushPromises();
}
beforeEach(() => {
  vi.clearAllMocks();
  // jsdom 不提供浏览器滚动 API，错误定位仍使用真实的当前编辑器 DOM。
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  mocks.confirm.mockResolvedValue(true);
  mocks.refresh.mockResolvedValue(undefined);
});
describe("menu editor workflow", () => {
  it("详情Tab直达步骤，修改后取消确认并返回原Tab", async () => {
    const submit = vi.fn();
    const wrapper = fixture(submit);
    wrapper.vm.show("app", [row], row);
    await flushPromises();
    expect(wrapper.find('[data-size="min(560px, 100vw)"]').exists()).toBe(true);
    wrapper.findComponent(Tabs).vm.$emit("update:modelValue", "2");
    await flushPromises();
    await click(wrapper, "编辑当前分组");
    expect(wrapper.findComponent(Nav).props("current")).toBe(2);
    const name = wrapper.get('input[placeholder="留空使用菜单 ID 生成稳定名称"]');
    await name.setValue("orders");
    mocks.confirm.mockResolvedValueOnce(false);
    await click(wrapper, "取消");
    expect(wrapper.find('[data-size="100%"]')).toBeTruthy();
    await click(wrapper, "取消");
    expect(wrapper.findComponent(Tabs).props("modelValue")).toBe("2");
    expect(submit).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it("保存局部草稿完整参数，关闭透传清空声明且成功返回原Tab", async () => {
    const submit = vi.fn();
    const wrapper = fixture(submit);
    wrapper.vm.show("app", [row], row);
    await flushPromises();
    wrapper.findComponent(Tabs).vm.$emit("update:modelValue", "2");
    await flushPromises();
    await click(wrapper, "编辑当前分组");
    await click(wrapper, "保存");
    expect(submit.mock.calls[0]?.[0].routeParams).toEqual([{ name: "a", remark: "编号" }]);
    expect(wrapper.findComponent(Tabs).props("modelValue")).toBe("2");
    await click(wrapper, "编辑当前分组");
    await wrapper.findAll('input[type="checkbox"]')[2]!.setValue(false);
    await click(wrapper, "保存");
    expect(submit.mock.calls[1]?.[0].routeParams).toEqual([]);
    expect(submit.mock.calls[1]?.[0].props).toBe(false);
    expect(mocks.refresh).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it("版本冲突保留草稿并阻止重复提交，重新加载回到原详情Tab", async () => {
    mocks.update.mockRejectedValue(new ApiError({ kind: "http", status: 409, message: "冲突" }));
    mocks.reload.mockResolvedValue({
      data: [{ ...row, version: "2", record: { ...row.record, routeName: "latest" } }],
    });
    const wrapper = fixture();
    wrapper.vm.show("app", [row], row);
    await flushPromises();
    wrapper.findComponent(Tabs).vm.$emit("update:modelValue", "2");
    await flushPromises();
    await click(wrapper, "编辑当前分组");
    await wrapper.get('input[placeholder="留空使用菜单 ID 生成稳定名称"]').setValue("draft");
    await click(wrapper, "保存");
    expect(mocks.update).toHaveBeenCalledOnce();
    expect(
      wrapper
        .findAll("button")
        .find((b) => b.text() === "保存")
        ?.attributes("disabled"),
    ).toBeDefined();
    expect(wrapper.get('input[placeholder="留空使用菜单 ID 生成稳定名称"]').element.value).toBe(
      "draft",
    );
    await click(wrapper, "重新加载");
    expect(wrapper.findComponent(Tabs).props("modelValue")).toBe("2");
    await click(wrapper, "编辑当前分组");
    expect(wrapper.get('input[placeholder="留空使用菜单 ID 生成稳定名称"]').element.value).toBe(
      "latest",
    );
    wrapper.unmount();
  });

  it("统一校验定位错误分组，保存失败保留草稿", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("failed"));
    const wrapper = fixture(submit);
    wrapper.vm.show("app", [row], row);
    await flushPromises();
    wrapper.findComponent(Tabs).vm.$emit("update:modelValue", "2");
    await flushPromises();
    await click(wrapper, "编辑当前分组");
    wrapper.findComponent(Nav).vm.$emit("change", 0);
    await flushPromises();
    await wrapper.get('input[placeholder="如订单详情"]').setValue("");
    wrapper.findComponent(Nav).vm.$emit("change", 2);
    await flushPromises();
    await click(wrapper, "保存");
    expect(wrapper.findComponent(Nav).props("current")).toBe(0);
    expect(submit).not.toHaveBeenCalled();
    await wrapper.get('input[placeholder="如订单详情"]').setValue("仍保留");
    await click(wrapper, "保存");
    expect(wrapper.get('input[placeholder="如订单详情"]').element.value).toBe("仍保留");
    wrapper.unmount();
  });
});
