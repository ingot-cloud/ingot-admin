// @vitest-environment jsdom
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BizIamMemberPickerDialog from "./BizIamMemberPickerDialog.vue";
import { organizationMemberPickerKey } from "./organizationMemberPicker";

const state = vi.hoisted(() => ({
  epoch: undefined as import("vue").Ref<number> | undefined,
  canBrowse: true,
  version: undefined as import("vue").Ref<string> | undefined,
}));
vi.mock("@ingot/admin-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-core")>();
  const { defineComponent, ref } = await import("vue");
  state.epoch = ref(0);
  state.version = ref("v1");
  return {
    ...actual,
    useCapabilities: () => ({
      hasAction: () => state.canBrowse,
      contextEpoch: state.epoch,
      version: state.version,
    }),
    InCloseButton: defineComponent({
      props: ["label"],
      emits: ["click"],
      template: '<button :aria-label="label" @click="$emit(\'click\')">移除</button>',
    }),
  };
});
const checkbox = defineComponent({
  props: ["modelValue", "disabled"],
  emits: ["change"],
  template:
    '<input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'change\', !modelValue)" />',
});
const button = defineComponent({
  props: ["disabled"],
  emits: ["in-click"],
  template: '<button :disabled="disabled" @click="$emit(\'in-click\')"><slot/></button>',
});
const input = defineComponent({
  name: "SearchStub",
  props: ["modelValue"],
  emits: ["update:modelValue", "clear", "input"],
  template:
    "<input :value=\"modelValue\" @input=\"$emit('update:modelValue', $event.target.value); $emit('input', $event.target.value)\" />",
});
const members = [
  { id: "101", name: "甲" },
  { id: "102", name: "乙" },
];
const page = (records = members) => ({ records, total: records.length, current: 1, size: 20 });
const create = (
  loadMembers = vi.fn().mockResolvedValue(page()),
  loadBound?: ReturnType<typeof vi.fn>,
) => {
  const navigation = vi.fn().mockImplementation(async (id?: string) => ({
    items: id ? [] : [{ id: "11", name: "研发" }],
    total: id ? 0 : 1,
    page: 1,
    pageSize: 20,
    breadcrumbs: id ? [{ id, name: "研发" }] : [],
    organization: { id: "1", name: "英格特云" },
  }));
  const wrapper = mount(BizIamMemberPickerDialog, {
    props: { organization: true, loadMembers, loadBound },
    global: {
      provide: { [organizationMemberPickerKey as symbol]: { loadDepartments: navigation } },
      stubs: {
        InDialog: {
          props: ["modelValue"],
          template: '<div v-if="modelValue" data-dialog><slot/><slot name="footer"/></div>',
        },
        InLoading: { template: "<div><slot/></div>" },
        InButton: button,
        InIcon: true,
        InAvatar: true,
        ElCheckbox: checkbox,
        ElInput: input,
        ElPagination: true,
      },
    },
  });
  return { wrapper, loadMembers, navigation };
};
const click = async (wrapper: ReturnType<typeof create>["wrapper"], label: string) => {
  const button = wrapper.findAll("button").find((item) => item.text() === label);
  expect(button, label).toBeDefined();
  await button!.trigger("click");
  await flushPromises();
};
const choose = async (wrapper: ReturnType<typeof create>["wrapper"], name: string) => {
  const row = wrapper.findAll("label").find((item) => item.text() === name);
  expect(row).toBeDefined();
  await row!.get("input").setValue(true);
  await flushPromises();
};
beforeEach(() => {
  state.canBrowse = true;
  state.epoch!.value = 0;
  state.version!.value = "v1";
});

describe("组织成员对话框", () => {
  it("部门只能展开，跨部门选择按成员ID去重", async () => {
    const { wrapper, loadMembers } = create();
    wrapper.vm.show([]);
    await flushPromises();
    expect(wrapper.get('[aria-label="研发（部门不可选）"]').attributes("disabled")).toBeDefined();
    await choose(wrapper, "甲");
    await click(wrapper, "展开");
    expect(loadMembers).toHaveBeenLastCalledWith(expect.objectContaining({ departmentId: "11" }));
    expect(
      wrapper
        .findAll("label")
        .find((item) => item.text() === "甲")!
        .get("input").element,
    ).toHaveProperty("checked", true);
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")?.[0]?.[0]).toEqual([members[0]]);
    wrapper.unmount();
  });

  it("搜索跨部门、清空恢复原分支并保留已选", async () => {
    const { wrapper, loadMembers } = create();
    wrapper.vm.show([]);
    await flushPromises();
    await click(wrapper, "展开");
    await choose(wrapper, "甲");
    const input = wrapper.get('input:not([type="checkbox"])');
    await input.setValue("乙");
    await input.trigger("keyup.enter");
    await flushPromises();
    expect(loadMembers).toHaveBeenLastCalledWith({ current: 1, size: 20, query: "乙" });
    expect(wrapper.text()).toContain("已选：1");
    await input.setValue("");
    wrapper.findComponent({ name: "SearchStub" }).vm.$emit("clear");
    await flushPromises();
    expect(loadMembers).toHaveBeenCalledTimes(3);
    expect(
      wrapper
        .findAll("label")
        .find((item) => item.text() === "甲")!
        .get("input").element,
    ).toHaveProperty("checked", true);
    await click(wrapper, "取消");
    expect(wrapper.emitted("confirm")).toBeUndefined();
    wrapper.unmount();
  });

  it("关联分页清空仅移除可见已加载关系并返回差量", async () => {
    const bound = vi.fn().mockResolvedValue({ ...page([members[0]]), total: 25 });
    const { wrapper } = create(vi.fn().mockResolvedValue(page([members[1]])), bound);
    wrapper.vm.show({ boundIds: ["999"], partial: true });
    await flushPromises();
    expect(wrapper.text()).toContain("已选：25");
    await click(wrapper, "清空");
    await click(wrapper, "确定");
    const event = wrapper.emitted("confirm")![0]!;
    expect(event[2]).toEqual({ added: [], removedIds: ["101"] });
    expect((event[0] as Array<{ id: string }>).map((item) => item.id)).toContain("999");
    wrapper.unmount();
  });

  it("重新打开时保留此前已加载页的选中关系与姓名", async () => {
    const bound = vi.fn().mockResolvedValue(page([members[0]]));
    const { wrapper } = create(undefined, bound);
    wrapper.vm.show({ boundIds: ["101"], boundItems: members, partial: true });
    await flushPromises();
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![0]![0]).toEqual(members);
    wrapper.unmount();
  });

  it("单选允许在对话框内清除草稿，确认后回填空值", async () => {
    const { wrapper } = create();
    await wrapper.setProps({ multiple: false });
    wrapper.vm.show([members[0]!]);
    await flushPromises();
    await click(wrapper, "清除选择");
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![0]![0]).toEqual([]);
    wrapper.unmount();
  });

  it("首位自动设主、明确切换和移除主负责人均只修改草稿，部门快照直接复用", async () => {
    const records = [
      { id: "101", name: "甲", summary: "研发部、产品部" },
      { id: "102", name: "乙", summary: "产品部" },
    ];
    const loader = vi.fn().mockResolvedValue(page(records));
    const { wrapper } = create(loader);
    await wrapper.setProps({ showPrimary: true });
    wrapper.vm.show([]);
    await flushPromises();
    expect(wrapper.text()).toContain("英格特云");
    expect(wrapper.text()).not.toContain("全选本页");
    await choose(wrapper, "甲");
    expect(wrapper.text()).toContain("部门主负责人");
    expect(wrapper.text()).toContain("研发部、产品部");
    await choose(wrapper, "乙");
    expect(wrapper.text()).toContain("可选择多位部门负责人，必须有一个主负责人");
    await click(wrapper, "设为部门主负责人");
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![0]![1]).toBe("102");
    expect(loader).toHaveBeenCalledTimes(1);
    wrapper.vm.show(records, undefined, "102");
    await flushPromises();
    await wrapper.get('button[aria-label="移除 乙"]').trigger("click");
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![1]![1]).toBe("101");
    wrapper.unmount();
  });

  it("打开或新增成员不替换已有不可用主负责人", async () => {
    const { wrapper } = create();
    await wrapper.setProps({ showPrimary: true });
    wrapper.vm.show([{ id: "old", name: "旧负责人", available: false }], undefined, "old");
    await flushPromises();
    await choose(wrapper, "甲");
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![0]![1]).toBe("old");
    wrapper.unmount();
  });

  it("部门路径末级为文本，祖先返回不清除已选", async () => {
    const { wrapper } = create();
    wrapper.vm.show([]);
    await flushPromises();
    await choose(wrapper, "甲");
    await click(wrapper, "展开");
    expect(wrapper.get('[aria-current="location"]').text()).toBe("研发");
    expect(wrapper.get('[aria-current="location"]').element.tagName).toBe("SPAN");
    await click(wrapper, "英格特云");
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![0]![0]).toEqual([members[0]]);
    wrapper.unmount();
  });

  it("输入姓名延迟搜索，关闭时取消尚未发出的请求", async () => {
    vi.useFakeTimers();
    const { wrapper, loadMembers } = create();
    try {
      wrapper.vm.show([]);
      await flushPromises();
      await wrapper.get('input:not([type="checkbox"])').setValue("甲");
      expect(loadMembers).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(250);
      await flushPromises();
      expect(loadMembers).toHaveBeenLastCalledWith({ current: 1, size: 20, query: "甲" });
      await wrapper.get('input:not([type="checkbox"])').setValue("乙");
      await click(wrapper, "取消");
      await vi.advanceTimersByTimeAsync(250);
      expect(loadMembers).toHaveBeenCalledTimes(2);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it("没有部门资格时只使用原候选，不请求组织部门", async () => {
    state.canBrowse = false;
    const { wrapper, loadMembers, navigation } = create();
    wrapper.vm.show([]);
    await flushPromises();
    expect(navigation).not.toHaveBeenCalled();
    expect(loadMembers).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("无部门浏览权限");
    wrapper.unmount();
  });

  it.each(["epoch", "version"])("权限变化（%s）后关闭并忽略旧候选响应", async (mode) => {
    let finish: ((value: ReturnType<typeof page>) => void) | undefined;
    const loader = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue(page([members[1]]));
    const { wrapper } = create(loader);
    wrapper.vm.show([]);
    await flushPromises();
    if (mode === "epoch") state.epoch!.value++;
    else state.version!.value = "v2";
    await flushPromises();
    expect(wrapper.find("[data-dialog]").exists()).toBe(false);
    wrapper.vm.show([]);
    await flushPromises();
    finish!(page([{ id: "old", name: "旧范围姓名" }]));
    await flushPromises();
    expect(wrapper.text()).toContain("乙");
    expect(wrapper.text()).not.toContain("旧范围姓名");
    wrapper.unmount();
  });
});

describe("专用组织浏览接口", () => {
  const result = (departmentId?: string, departmentPage = 1) => ({
    navigationAvailable: true,
    navigation: {
      items: departmentId
        ? []
        : [
            {
              id: departmentPage === 1 ? "11" : "12",
              name: departmentPage === 1 ? "研发" : "产品",
            },
          ],
      total: departmentId ? 0 : 21,
      page: departmentPage,
      pageSize: 20,
      breadcrumbs: departmentId ? [{ id: departmentId, name: "研发" }] : [],
      organization: { id: "1", name: "测试组织" },
    },
    members: page(departmentId ? members : [members[0]!]),
  });
  it("首次一次返回导航与候选，展开和面包屑共用浏览且跨分支保留勾选", async () => {
    const { wrapper, navigation, loadMembers } = create();
    const browse = vi.fn().mockImplementation(async (params) => result(params.departmentId));
    await wrapper.setProps({ loadBrowse: browse });
    wrapper.vm.show([]);
    await flushPromises();
    expect(browse).toHaveBeenCalledTimes(1);
    expect(navigation).not.toHaveBeenCalled();
    expect(loadMembers).not.toHaveBeenCalled();
    await choose(wrapper, "甲");
    await click(wrapper, "展开");
    expect(browse).toHaveBeenLastCalledWith(
      expect.objectContaining({ departmentId: "11", departmentPage: 1 }),
    );
    expect(
      wrapper
        .findAll("label")
        .find((item) => item.text() === "甲")!
        .get("input").element,
    ).toHaveProperty("checked", true);
    await choose(wrapper, "乙");
    await click(wrapper, "测试组织");
    expect(browse).toHaveBeenCalledTimes(2); // 回到根复用同一会话内快照。
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![0]![0]).toEqual(members);
    wrapper.unmount();
  });
  it("部门与成员独立分页，成员翻页不覆盖已加载部门", async () => {
    const { wrapper } = create();
    const browse = vi.fn().mockImplementation(async (params) => ({
      ...result(params.departmentId, params.departmentPage),
      members: { ...page(), total: 23, current: params.current },
    }));
    await wrapper.setProps({ loadBrowse: browse });
    wrapper.vm.show([]);
    await flushPromises();
    await choose(wrapper, "甲");
    await click(wrapper, "加载更多部门");
    expect(browse).toHaveBeenLastCalledWith(
      expect.objectContaining({ current: 1, departmentPage: 2 }),
    );
    expect(wrapper.findAll("[data-department-row]")).toHaveLength(2);
    await click(wrapper, "加载更多成员");
    expect(browse).toHaveBeenLastCalledWith(
      expect.objectContaining({ current: 2, departmentPage: 2 }),
    );
    expect(wrapper.findAll("[data-department-row]")).toHaveLength(2);
    expect(wrapper.text()).toContain("已选：1");
    wrapper.unmount();
  });
  it("搜索保留导航上下文，清空恢复原分支缓存", async () => {
    const { wrapper } = create();
    const browse = vi.fn().mockImplementation(async (params) => result(params.departmentId));
    await wrapper.setProps({ loadBrowse: browse });
    wrapper.vm.show([]);
    await flushPromises();
    await click(wrapper, "展开");
    const input = wrapper.get('input:not([type="checkbox"])');
    await input.setValue("乙");
    await input.trigger("keyup.enter");
    await flushPromises();
    expect(browse).toHaveBeenLastCalledWith(
      expect.objectContaining({ departmentId: "11", query: "乙" }),
    );
    await input.setValue("");
    wrapper.findComponent({ name: "SearchStub" }).vm.$emit("clear");
    await flushPromises();
    expect(browse).toHaveBeenCalledTimes(3);
    expect(wrapper.text()).toContain("研发");
    wrapper.unmount();
  });
  it("关闭后迟到的导航和成员都不能污染下一次会话", async () => {
    const { wrapper } = create();
    let finish: (value: ReturnType<typeof result>) => void = () => {};
    const browse = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue(result("11"));
    await wrapper.setProps({ loadBrowse: browse });
    wrapper.vm.show([]);
    await flushPromises();
    await click(wrapper, "取消");
    wrapper.vm.show([]);
    await flushPromises();
    const stale = result();
    stale.navigation.organization.name = "旧组织名称";
    stale.members = page([{ id: "old", name: "旧范围姓名" }]);
    finish(stale);
    await flushPromises();
    expect(wrapper.text()).not.toContain("旧组织名称");
    expect(wrapper.text()).not.toContain("旧范围姓名");
    expect(wrapper.text()).toContain("乙");
    wrapper.unmount();
  });
  it("服务端收回部门权限时使用可选成员标题", async () => {
    const { wrapper, navigation, loadMembers } = create();
    const data = result();
    const browse = vi.fn().mockResolvedValue({
      ...data,
      navigationAvailable: false,
      navigation: { ...data.navigation, organization: undefined, items: [], total: 0 },
    });
    await wrapper.setProps({ loadBrowse: browse });
    wrapper.vm.show([]);
    await flushPromises();
    expect(browse).toHaveBeenCalledTimes(1);
    expect(navigation).not.toHaveBeenCalled();
    expect(loadMembers).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("可选成员");
    expect(wrapper.text()).not.toContain("当前组织");
    wrapper.unmount();
  });
});

describe("外部已选快照与追加加载", () => {
  const people = (count: number, start = 0) =>
    Array.from({ length: count }, (_, index) => ({
      id: String(1000 + start + index),
      name: `成员${start + index + 1}`,
    }));
  const snapshot = (count: number, total = count, current = 1, start = 0) => ({
    records: people(count, start),
    total,
    current,
    size: 20,
  });
  it.each([0, 1, 20])("外部已加载全部%d人时不重查首屏、不显示加载更多", async (count) => {
    const bound = vi.fn();
    const { wrapper } = create(undefined, bound);
    const initial = snapshot(count);
    wrapper.vm.show({
      boundIds: initial.records.map((item) => item.id),
      initialBoundPage: initial,
      partial: true,
    });
    await flushPromises();
    expect(bound).not.toHaveBeenCalled();
    expect(wrapper.find('[data-picker-more="selected"]').exists()).toBe(false);
    expect(wrapper.find('[data-picker-more="members"]').exists()).toBe(false);
    await click(wrapper, "取消");
    expect(initial.records).toHaveLength(count);
    expect(wrapper.emitted("confirm")).toBeUndefined();
    wrapper.unmount();
  });
  it("部分已选从下一页追加，失败重试同一页，移除不导致重新显示加载更多", async () => {
    const initial = snapshot(20, 25);
    const bound = vi
      .fn()
      .mockRejectedValueOnce(new Error("暂时失败"))
      .mockResolvedValue(snapshot(5, 25, 2, 20));
    const { wrapper } = create(undefined, bound);
    wrapper.vm.show({
      boundIds: initial.records.map((item) => item.id),
      initialBoundPage: initial,
      partial: true,
    });
    await flushPromises();
    expect(wrapper.text()).toContain("已选：25");
    expect(bound).not.toHaveBeenCalled();
    const selectedList = wrapper.get(".organization-picker-selected");
    Object.defineProperties(selectedList.element, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, value: 700 },
    });
    await selectedList.trigger("scroll");
    await flushPromises();
    expect(bound).toHaveBeenLastCalledWith({ current: 2, size: 20 });
    expect(wrapper.text()).toContain("成员20");
    expect(wrapper.get('[data-picker-more="selected"]').text()).toContain("加载失败，重试");
    await wrapper.get('[data-picker-more="selected"] button').trigger("click");
    await flushPromises();
    expect(bound).toHaveBeenCalledTimes(2);
    expect(bound).toHaveBeenLastCalledWith({ current: 2, size: 20 });
    expect(wrapper.text()).toContain("成员25");
    expect(wrapper.find('[data-picker-more="selected"]').exists()).toBe(false);
    await wrapper.get('button[aria-label="移除 成员1"]').trigger("click");
    expect(wrapper.find('[data-picker-more="selected"]').exists()).toBe(false);
    await click(wrapper, "确定");
    const event = wrapper.emitted("confirm")![0]!;
    expect(event[2]).toEqual({ added: [], removedIds: ["1000"] });
    expect(event[3]).toEqual(snapshot(25, 25, 2));
    wrapper.vm.show({
      boundIds: initial.records.map((item) => item.id),
      initialBoundPage: event[3] as ReturnType<typeof snapshot>,
      partial: true,
      removedIds: ["1000"],
    });
    await flushPromises();
    expect(bound).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("已选：24");
    expect(wrapper.find('[data-picker-more="selected"]').exists()).toBe(false);
    wrapper.unmount();
  });
  it("21名候选追加保留已选，全选只包含已加载人员，末页隐藏按钮", async () => {
    const loader = vi
      .fn()
      .mockImplementation(async (params) =>
        params.current === 1 ? snapshot(20, 21) : snapshot(1, 21, 2, 20),
      );
    const { wrapper } = create(loader);
    wrapper.vm.show([]);
    await flushPromises();
    expect(wrapper.findComponent({ name: "ElPagination" }).exists()).toBe(false);
    await choose(wrapper, "成员1");
    await click(wrapper, "加载更多成员");
    expect(loader).toHaveBeenLastCalledWith({ current: 2, size: 20, query: undefined });
    expect(wrapper.findAll("label")).toHaveLength(21);
    expect(wrapper.find('[data-picker-more="members"]').exists()).toBe(false);
    await wrapper.get(".organization-picker-all input").setValue(true);
    await click(wrapper, "确定");
    expect(wrapper.emitted("confirm")![0]![0]).toHaveLength(21);
    expect(loader).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });
  it.each([0, 20])("候选完整展示%d条时没有加载更多及多余占位", async (count) => {
    const loader = vi.fn().mockResolvedValue(snapshot(count));
    const { wrapper } = create(loader);
    wrapper.vm.show([]);
    await flushPromises();
    expect(wrapper.findAll("label")).toHaveLength(count);
    expect(wrapper.find('[data-picker-more="members"]').exists()).toBe(false);
    expect(wrapper.find(".organization-picker-more").exists()).toBe(false);
    expect(loader).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  it("滚动到底触发一次下一页，加载中不重复，空页后停止", async () => {
    let finish: (value: ReturnType<typeof snapshot>) => void = () => {};
    const loader = vi
      .fn()
      .mockResolvedValueOnce(snapshot(20, 100))
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const { wrapper } = create(loader);
    wrapper.vm.show([]);
    await flushPromises();
    const list = wrapper.get(".organization-picker-candidates");
    Object.defineProperties(list.element, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, value: 700 },
    });
    await list.trigger("scroll");
    await list.trigger("scroll");
    await flushPromises();
    expect(loader).toHaveBeenCalledTimes(2);
    expect(wrapper.get('[data-picker-more="members"]').text()).toContain("加载中");
    finish(snapshot(0, 100, 2));
    await flushPromises();
    expect(wrapper.find('[data-picker-more="members"]').exists()).toBe(false);
    await list.trigger("scroll");
    expect(loader).toHaveBeenCalledTimes(2);
    expect(wrapper.findAll("label")).toHaveLength(20);
    wrapper.unmount();
  });
  it("搜索变化后迟到的追加页不污染新结果", async () => {
    let finish: (value: ReturnType<typeof snapshot>) => void = () => {};
    const loader = vi.fn().mockImplementation((params) =>
      params.query
        ? Promise.resolve(page([{ id: "new", name: "搜索结果" }]))
        : params.current === 1
          ? Promise.resolve(snapshot(20, 21))
          : new Promise((resolve) => {
              finish = resolve;
            }),
    );
    const { wrapper } = create(loader);
    wrapper.vm.show([]);
    await flushPromises();
    await click(wrapper, "加载更多成员");
    const input = wrapper.get('input:not([type="checkbox"])');
    await input.setValue("搜索");
    await input.trigger("keyup.enter");
    await flushPromises();
    finish(snapshot(1, 21, 2, 20));
    await flushPromises();
    expect(wrapper.text()).toContain("搜索结果");
    expect(wrapper.text()).not.toContain("成员21");
    expect(wrapper.find('[data-picker-more="members"]').exists()).toBe(false);
    wrapper.unmount();
  });
  it("部门末页追加后隐藏按钮，人员集合不受影响", async () => {
    const { wrapper, navigation } = create();
    navigation.mockImplementation(async (_id, requested = 1) => ({
      items: people(requested === 1 ? 20 : 1, requested === 1 ? 0 : 20),
      total: 21,
      page: requested,
      pageSize: 20,
      breadcrumbs: [],
      organization: { id: "1", name: "组织" },
    }));
    wrapper.vm.show([]);
    await flushPromises();
    await click(wrapper, "加载更多部门");
    expect(navigation).toHaveBeenLastCalledWith(undefined, 2);
    expect(wrapper.findAll("[data-department-row]")).toHaveLength(21);
    expect(wrapper.find('[data-picker-more="departments"]').exists()).toBe(false);
    expect(wrapper.findAll("label")).toHaveLength(2);
    wrapper.unmount();
  });
  it("平台选择器保留页码翻页", async () => {
    const loader = vi.fn().mockResolvedValue(snapshot(20, 21));
    const { wrapper } = create(loader);
    await wrapper.setProps({ organization: false });
    wrapper.vm.show([]);
    await flushPromises();
    expect(wrapper.findComponent({ name: "ElPagination" }).exists()).toBe(true);
    expect(wrapper.find('[data-picker-more="members"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
