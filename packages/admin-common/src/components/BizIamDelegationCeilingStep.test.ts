// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { defineComponent, h, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Confirm } from "@ingot/admin-core";
import {
  ScopeBindingKind,
  ScopeKind,
  type ActionScopeCeiling,
  type AuthorizationActionOption,
  type AuthorizationCandidatesApi,
} from "../models/iam";
import BizIamDelegationCeilingStep from "./BizIamDelegationCeilingStep.vue";

const actions = [
  {
    id: "1",
    name: "创建",
    applicationName: "平台",
    resourceName: "成员",
    resourceId: "10",
    scopeCapabilities: [ScopeKind.ALL],
  },
  {
    id: "2",
    name: "创建",
    applicationName: "平台",
    resourceName: "用户组",
    resourceId: "11",
    scopeCapabilities: [ScopeKind.ALL],
  },
] as AuthorizationActionOption[];
const stubs = {
  ElAlert: true,
  ElInput: true,
  ElOption: true,
  ElPagination: true,
  InIcon: true,
  ElSelect: {
    name: "ElSelect",
    props: ["modelValue", "placeholder"],
    emits: ["change"],
    template:
      "<button @click=\"$emit('change', placeholder === '批量设置本资源范围' ? 'ALL' : ['ALL'])\">设置全部</button>",
  },
  InButton: {
    emits: ["inClick"],
    template: "<button @click=\"$emit('inClick')\"><slot /></button>",
  },
  BizIamDelegationCandidatePicker: true,
};

beforeEach(() => {
  vi.spyOn(Confirm, "warning").mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

const resourceActions = Array.from({ length: 21 }, (_, index) => ({
  ...actions[0],
  id: String(index + 1),
  name: `操作 ${index + 1}`,
  scopeCapabilities: [ScopeKind.ALL, ScopeKind.OBJECT_SET],
}));
const otherResourceAction = { ...actions[1], id: "99" };
const withObjects = (id: string, ids: string[]): ActionScopeCeiling => ({
  actionId: id,
  scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "objects_10" }],
  scopeBindings: { objects_10: { kind: ScopeBindingKind.OBJECTS, ids } },
});
const createControlledStep = (initial: Record<string, ActionScopeCeiling>) => {
  const draft = ref(initial);
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(BizIamDelegationCeilingStep, {
          actions: [...resourceActions, otherResourceAction],
          api: vi.fn() as AuthorizationCandidatesApi,
          modelValue: draft.value,
          "onUpdate:modelValue": (value) => {
            draft.value = value;
          },
        }),
    }),
    { global: { plugins: [createPinia()], stubs } },
  );
  return { draft, wrapper, step: wrapper.getComponent(BizIamDelegationCeilingStep) };
};

describe("委派受控草稿批量修改", () => {
  it("按完整资源集合一次更新范围，包含搜索和分页未展示的操作", async () => {
    const initial = Object.fromEntries(
      [...resourceActions, otherResourceAction].map((action) => [
        action.id,
        { actionId: action.id, scopes: [{ kind: ScopeKind.ALL }], scopeBindings: {} },
      ]),
    );
    const { draft, wrapper, step } = createControlledStep(initial);
    step.getComponent({ name: "ElInput" }).vm.$emit("update:modelValue", "操作 1");
    await flushPromises();
    const batch = step
      .findAllComponents({ name: "ElSelect" })
      .find((select) => select.props("placeholder") === "批量设置本资源范围");
    expect(batch).toBeDefined();
    batch!.vm.$emit("change", ScopeKind.OBJECT_SET);
    await flushPromises();
    for (const action of resourceActions) {
      expect(draft.value[action.id]).toEqual(withObjects(action.id, []));
      expect(initial[action.id].scopes).toEqual([{ kind: ScopeKind.ALL }]);
    }
    expect(draft.value["99"]).toEqual(initial["99"]);
    expect(step.emitted("update:modelValue")).toHaveLength(1);
    wrapper.unmount();
  });

  it("一次复制所有同资源指定对象操作，其他范围和资源不变且数组独立", async () => {
    const initial: Record<string, ActionScopeCeiling> = Object.fromEntries(
      resourceActions.map((action) => [action.id, withObjects(action.id, ["旧对象"])]),
    );
    initial["1"] = withObjects("1", ["对象一", "对象二"]);
    initial["3"] = { actionId: "3", scopes: [{ kind: ScopeKind.ALL }], scopeBindings: {} };
    initial["99"] = withObjects("99", ["其他资源对象"]);
    const { draft, wrapper, step } = createControlledStep(initial);
    await step
      .findAll("button")
      .find((button) => button.text() === "应用到本资源其他操作")!
      .trigger("click");
    await flushPromises();
    for (const action of resourceActions.filter((item) => item.id !== "3")) {
      expect(draft.value[action.id]).toEqual(withObjects(action.id, ["对象一", "对象二"]));
    }
    expect(draft.value["3"]).toEqual(initial["3"]);
    expect(draft.value["99"]).toEqual(initial["99"]);
    expect(initial["2"].scopeBindings.objects_10.ids).toEqual(["旧对象"]);
    const secondIds = draft.value["2"].scopeBindings.objects_10.ids;
    expect(secondIds).not.toBe(draft.value["1"].scopeBindings.objects_10.ids);
    expect(secondIds).not.toBe(draft.value["21"].scopeBindings.objects_10.ids);
    expect(step.emitted("update:modelValue")).toHaveLength(1);
    wrapper.unmount();
  });

  it("没有其他指定对象操作时不提交空更新", async () => {
    const initial: Record<string, ActionScopeCeiling> = Object.fromEntries(
      resourceActions.map((action) => [
        action.id,
        { actionId: action.id, scopes: [{ kind: ScopeKind.ALL }], scopeBindings: {} },
      ]),
    );
    initial["1"] = withObjects("1", ["来源对象"]);
    const { draft, wrapper, step } = createControlledStep(initial);
    await step
      .findAll("button")
      .find((button) => button.text() === "应用到本资源其他操作")!
      .trigger("click");
    await flushPromises();
    expect(draft.value).toEqual(initial);
    expect(step.emitted("update:modelValue")).toBeUndefined();
    expect(Confirm.warning).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it.each(["scope", "objects"])("取消%s覆盖不修改受控草稿", async (operation) => {
    vi.mocked(Confirm.warning).mockRejectedValueOnce(new Error("取消"));
    const initial = Object.fromEntries(
      resourceActions.map((action) => [
        action.id,
        withObjects(action.id, action.id === "1" ? ["来源对象"] : ["原对象"]),
      ]),
    );
    const { draft, wrapper, step } = createControlledStep(initial);
    if (operation === "scope") {
      step
        .findAllComponents({ name: "ElSelect" })
        .find((select) => select.props("placeholder") === "批量设置本资源范围")!
        .vm.$emit("change", ScopeKind.ALL);
    } else {
      await step
        .findAll("button")
        .find((button) => button.text() === "应用到本资源其他操作")!
        .trigger("click");
    }
    await flushPromises();
    expect(draft.value).toEqual(initial);
    expect(step.emitted("update:modelValue")).toBeUndefined();
    wrapper.unmount();
  });
});

describe("委派分步确认全部操作", () => {
  it("只读步骤展示同名操作的资源上下文且不修改任何操作", () => {
    const wrapper = mount(BizIamDelegationCeilingStep, {
      props: {
        actions,
        api: vi.fn() as AuthorizationCandidatesApi,
        modelValue: {},
        viewOnly: true,
      },
      global: { plugins: [createPinia()], stubs },
    });
    expect(wrapper.text()).toContain("平台");
    expect(wrapper.text()).toContain("成员");
    expect(wrapper.text()).toContain("用户组");
    expect(wrapper.text()).toContain("创建");
    expect(wrapper.text()).toContain("2 项操作");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("设置上限时仍保留角色版本的完整操作集合", async () => {
    const wrapper = mount(BizIamDelegationCeilingStep, {
      props: {
        actions,
        api: vi.fn() as AuthorizationCandidatesApi,
        modelValue: {
          "1": { actionId: "1", scopes: [], scopeBindings: {} },
          "2": { actionId: "2", scopes: [], scopeBindings: {} },
        },
      },
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "设置全部")
      ?.trigger("click");
    expect(wrapper.text()).toContain("用户组");
    const draft = wrapper.emitted("update:modelValue")?.at(-1)?.[0] as Record<string, unknown>;
    expect(Object.keys(draft).sort()).toEqual(["1", "2"]);
  });
});
