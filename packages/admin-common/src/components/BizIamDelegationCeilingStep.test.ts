// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import {
  ScopeKind,
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
    emits: ["change"],
    template: "<button @click=\"$emit('change', ['ALL'])\">设置全部</button>",
  },
};

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
