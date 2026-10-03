// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it } from "vitest";
import { ScopeBindingKind, ScopeKind, type AuthorizationActionOption } from "../models/iam";
import BizIamDelegationOperationTree from "./BizIamDelegationOperationTree.vue";

const actions = [
  {
    id: "1",
    name: "创建",
    applicationId: "app",
    applicationName: "平台",
    resourceId: "member",
    resourceName: "成员",
    scopeCapabilities: [ScopeKind.ALL],
  },
  {
    id: "2",
    name: "创建",
    applicationId: "app",
    applicationName: "平台",
    resourceId: "group",
    resourceName: "用户组",
    scopeCapabilities: [ScopeKind.OBJECT_SET],
  },
] as AuthorizationActionOption[];

describe("委派操作只读树", () => {
  it("按应用和资源区分同名操作，并展示预览中的上限", () => {
    const wrapper = mount(BizIamDelegationOperationTree, {
      props: {
        actions,
        showCeilings: true,
        ceilings: {
          "1": { actionId: "1", scopes: [{ kind: ScopeKind.ALL }], scopeBindings: {} },
          "2": {
            actionId: "2",
            scopes: [{ kind: ScopeKind.OBJECT_SET }],
            scopeBindings: { objects_group: { kind: ScopeBindingKind.OBJECTS, ids: ["123"] } },
          },
        },
      },
      global: { plugins: [createPinia()], stubs: { InIcon: true } },
    });
    expect(wrapper.findAll(".flex.flex-col.gap-8px")).toHaveLength(2);
    expect(wrapper.text()).toContain("成员");
    expect(wrapper.text()).toContain("用户组");
    expect(wrapper.text()).toContain("1 个对象");
  });
});
