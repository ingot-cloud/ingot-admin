// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import {
  ScopeKind,
  type AuthorizationActionOption,
  type AuthorizationCandidatesApi,
} from "../models/iam";
import BizIamDelegationActionCeilings from "./BizIamDelegationActionCeilings.vue";

const actions = [
  {
    id: "1",
    name: "创建",
    applicationName: "平台",
    resourceName: "成员管理",
    resourceId: "10",
    scopeCapabilities: [ScopeKind.ALL],
  },
  {
    id: "2",
    name: "创建",
    applicationName: "平台",
    resourceName: "用户组管理",
    resourceId: "11",
    scopeCapabilities: [ScopeKind.ALL],
  },
] as AuthorizationActionOption[];
const stubs = {
  InDialog: {
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
  },
  InButton: {
    emits: ["inClick"],
    template: "<button @click=\"$emit('inClick')\"><slot /></button>",
  },
  InIcon: true,
  ElInput: true,
  ElSelect: {
    emits: ["change"],
    template: "<button @click=\"$emit('change', ['ALL'])\">选择全部</button>",
  },
  ElOption: true,
  ElPagination: true,
};

describe("委派逐操作上限配置", () => {
  it("同名操作按资源辨识，取消不写草稿，确认只保存当前配置", async () => {
    const wrapper = mount(BizIamDelegationActionCeilings, {
      props: { actions, api: vi.fn() as AuthorizationCandidatesApi, resetKey: 1, modelValue: {} },
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.find('button[aria-label="配置逐操作范围上限"]').trigger("click");
    expect(wrapper.text()).toContain("平台 / 成员管理 / 创建");
    expect(wrapper.text()).toContain("平台 / 用户组管理 / 创建");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "取消")
      ?.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await wrapper.find('button[aria-label="配置逐操作范围上限"]').trigger("click");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "选择全部")
      ?.trigger("click");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "确定")
      ?.trigger("click");
    const saved = wrapper.emitted("update:modelValue")?.at(-1)?.[0] as Record<
      string,
      { scopes: Array<{ kind: ScopeKind }> }
    >;
    expect(saved["1"].scopes).toEqual([{ kind: ScopeKind.ALL }]);
    expect(saved["2"]).toBeUndefined();
  });
});
