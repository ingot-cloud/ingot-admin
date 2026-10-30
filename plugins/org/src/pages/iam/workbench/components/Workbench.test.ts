import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import WorkbenchShortcuts from "./WorkbenchShortcuts.vue";
import WorkbenchStatistics from "./WorkbenchStatistics.vue";
import WorkbenchTodos from "./WorkbenchTodos.vue";

const global = {
  stubs: {
    InAvatar: true,
    InLoading: defineComponent({ template: "<div><slot /></div>" }),
    InButton: defineComponent({ template: "<button><slot /></button>" }),
    InIcon: defineComponent({
      props: ["name"],
      template: '<span class="test-icon" :data-icon="name" />',
    }),
    RouterLink: defineComponent({ props: ["to"], template: '<a :href="to"><slot /></a>' }),
  },
};

describe("工作台模块", () => {
  it("区分合法零与无权读取，不把缺省指标显示成零", () => {
    const wrapper = mount(WorkbenchStatistics, {
      global,
      props: {
        statistics: { tenantId: "10", tenantName: "组织", memberCount: 0, applicationCount: 2 },
        loading: false,
        failed: false,
      },
    });
    expect(wrapper.findAll("dd").map((node) => node.text())).toEqual(["0", "—", "—", "2"]);
    expect(wrapper.findAll('[aria-label="无查看权限"]')).toHaveLength(2);
  });

  it("错误时隐藏旧统计并提供重试", async () => {
    const wrapper = mount(WorkbenchStatistics, {
      global,
      props: {
        statistics: { tenantId: "10", tenantName: "组织", memberCount: 18, applicationCount: 2 },
        loading: false,
        failed: true,
      },
    });
    expect(wrapper.find("dl").exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("暂时无法加载组织统计");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("动态图标、标题和跳转目标跟随菜单更新", async () => {
    const wrapper = mount(WorkbenchShortcuts, {
      global,
      props: {
        entries: [{ path: "/members", title: "成员", icon: "ep:user", ancestors: ["组织管理"] }],
      },
    });
    expect(wrapper.get(".test-icon").attributes("data-icon")).toBe("ep:user");
    await wrapper.setProps({
      entries: [{ path: "/people", title: "人员", icon: "ep:avatar", ancestors: ["组织管理"] }],
    });
    expect(wrapper.get(".test-icon").attributes("data-icon")).toBe("ep:avatar");
    expect(wrapper.get("a").attributes("href")).toBe("/people");
    expect(wrapper.text()).toContain("人员");
    await wrapper.setProps({ entries: [] });
    expect(wrapper.find("a").exists()).toBe(false);
  });

  it("待办只有未接入说明，不渲染假业务操作", () => {
    const wrapper = mount(WorkbenchTodos);
    expect(wrapper.text()).toContain("暂未接入业务待办");
    expect(wrapper.findAll("button,a")).toHaveLength(0);
  });
});
