import type { Ref } from "vue";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DepartmentTreeRow, MemberDepartmentView } from "@ingot/admin-common";
import MemberDepartmentField from "./MemberDepartmentField.vue";

const state = vi.hoisted(() => ({ tree: vi.fn(), version: undefined as Ref<string> | undefined }));
vi.mock("@/api/iam/directory", () => ({ TenantDepartmentTreeAPI: state.tree }));
vi.mock("@ingot/admin-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-core")>();
  const { ref } = await import("vue");
  state.version = ref("v1");
  return {
    ...actual,
    useCapabilities: () => ({
      contextEpoch: ref(0),
      version: state.version!,
      unavailable: ref(false),
      actionCodes: ref([]),
    }),
  };
});
const node = (
  id: string,
  name: string,
  parentId?: string,
  children: DepartmentTreeRow[] = [],
  navigationOnly = false,
): DepartmentTreeRow => ({
  record: { id, name, parentId, sortOrder: 0, navigationOnly },
  children,
  version: "0",
  fieldAccess: {},
  capabilities: {},
});
const rows = [
  node("root", "测试组织", undefined, [
    node("self", "研发部", "root", [node("child", "研发组", "self")]),
    node("product", "产品部", "root"),
    node("hidden", "受限部门", "root", [], true),
  ]),
];
const button = defineComponent({
  props: ["disabled"],
  emits: ["in-click"],
  template: '<button :disabled="disabled" @click="$emit(\'in-click\')"><slot/></button>',
});
const create = (
  multiple = false,
  value: MemberDepartmentView[] = [{ id: "root", name: "测试组织", primary: true }],
) =>
  mount(MemberDepartmentField, {
    props: { modelValue: value, multiple, excludeDepartmentId: multiple ? undefined : "self" },
    global: {
      stubs: {
        InDialog: {
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template: '<div v-if="modelValue" data-dialog><slot/><slot name="footer"/></div>',
        },
        InButton: button,
        InLoading: { template: "<div><slot/></div>" },
        InIcon: true,
      },
    },
  });
const click = async (wrapper: ReturnType<typeof create>, label: string) => {
  await wrapper
    .findAll("button")
    .find((item) => item.text() === label)!
    .trigger("click");
  await flushPromises();
};
const choose = async (wrapper: ReturnType<typeof create>, name: string) => {
  await wrapper
    .findAll(".el-tree-node__content")
    .find((item) => item.text().trim() === name)!
    .trigger("click");
  await flushPromises();
};
beforeEach(() => {
  vi.clearAllMocks();
  state.version!.value = "v1";
  state.tree.mockResolvedValue({ data: rows });
});
describe("共用部门对话框", () => {
  it("单选只在确认后回填，取消保持原值；禁选自身/子树/仅导航节点", async () => {
    const wrapper = create();
    await wrapper.get('[role="button"]').trigger("keydown.enter");
    await flushPromises();
    expect(state.tree).toHaveBeenCalledTimes(1);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
    expect(
      (wrapper.get('input[type="radio"][value="self"]').element as HTMLInputElement).disabled,
    ).toBe(true);
    expect(
      (wrapper.get('input[type="radio"][value="hidden"]').element as HTMLInputElement).disabled,
    ).toBe(true);
    await wrapper
      .findAll(".el-tree-node__content")
      .find((item) => item.text().trim() === "研发部")!
      .get(".el-tree-node__expand-icon")
      .trigger("click");
    await flushPromises();
    expect(
      (wrapper.get('input[type="radio"][value="child"]').element as HTMLInputElement).disabled,
    ).toBe(true);
    await choose(wrapper, "产品部");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await click(wrapper, "取消");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await wrapper.get('[role="button"]').trigger("click");
    await flushPromises();
    await choose(wrapper, "产品部");
    await click(wrapper, "确定");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      [{ id: "product", name: "产品部", primary: true }],
    ]);
    expect(state.tree).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  it("多选保留独立勾选和主部门排序，禁用时无法打开", async () => {
    const wrapper = create(true, []);
    await wrapper.get('[role="button"]').trigger("click");
    await flushPromises();
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false);
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await click(wrapper, "确定");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([
      [{ id: "root", name: "测试组织", primary: true }],
    ]);
    await wrapper.setProps({ disabled: true });
    await wrapper.get('[role="button"]').trigger("click");
    expect(wrapper.find("[data-dialog]").exists()).toBe(false);
    expect(state.tree).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  it("权限变化丢弃未完成树请求及缓存", async () => {
    let resolveOld!: (value: { data: DepartmentTreeRow[] }) => void;
    state.tree.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const wrapper = create();
    await wrapper.get('[role="button"]').trigger("click");
    await flushPromises();
    state.version!.value = "v2";
    await flushPromises();
    resolveOld({ data: [node("old", "旧范围")] });
    await flushPromises();
    expect(wrapper.find("[data-dialog]").exists()).toBe(false);
    await wrapper.get('[role="button"]').trigger("click");
    await flushPromises();
    expect(state.tree).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).not.toContain("旧范围");
    expect(wrapper.text()).toContain("产品部");
    wrapper.unmount();
  });
  it("关闭并重新打开同一上下文合并进行中的树请求", async () => {
    let finish!: (value: { data: DepartmentTreeRow[] }) => void;
    state.tree.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const wrapper = create();
    await wrapper.get('[role="button"]').trigger("click");
    await flushPromises();
    await click(wrapper, "取消");
    await wrapper.get('[role="button"]').trigger("click");
    await flushPromises();
    expect(state.tree).toHaveBeenCalledTimes(1);
    finish({ data: rows });
    await flushPromises();
    expect(wrapper.text()).toContain("产品部");
    wrapper.unmount();
  });
});
