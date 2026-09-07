import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import InBreadcrumb from "./InBreadcrumb.vue";

const DummyPage = defineComponent({
  render: () => h("div"),
});

const mountBreadcrumb = async (showIcon?: boolean) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/platform",
        component: DummyPage,
        meta: { title: "平台配置", icon: "platform" },
        children: [
          {
            path: "app",
            component: DummyPage,
            meta: { title: "应用管理", icon: "app" },
          },
        ],
      },
    ],
  });
  await router.push("/platform/app");
  await router.isReady();
  return mount(InBreadcrumb, {
    props: showIcon === undefined ? {} : { showIcon },
    global: {
      plugins: [router],
      stubs: {
        ElBreadcrumb: { template: "<nav class=\"el-breadcrumb\"><slot /></nav>" },
        ElBreadcrumbItem: { template: "<div class=\"el-breadcrumb-item\"><slot /></div>" },
        InIcon: {
          props: ["name"],
          template: "<i class=\"in-icon\" :data-name=\"name\"></i>",
        },
      },
    },
  });
};

describe("InBreadcrumb", () => {
  it("默认不显示菜单 icon", async () => {
    const wrapper = await mountBreadcrumb();
    expect(wrapper.text()).toContain("平台配置");
    expect(wrapper.text()).toContain("应用管理");
    expect(wrapper.find(".in-icon").exists()).toBe(false);
    wrapper.unmount();
  });

  it("showIcon 为 true 且有 icon 时显示", async () => {
    const wrapper = await mountBreadcrumb(true);
    const icons = wrapper.findAll(".in-icon");
    expect(icons).toHaveLength(2);
    expect(icons[0]?.attributes("data-name")).toBe("platform");
    expect(icons[1]?.attributes("data-name")).toBe("app");
    wrapper.unmount();
  });
});
