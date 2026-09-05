import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import InPageHeader from "./InPageHeader.vue";

const DummyPage = defineComponent({
  render: () => h("div"),
});

const mountHeader = async (
  options: {
    props?: Record<string, unknown>;
    slots?: Record<string, string>;
    menuTitle?: string;
  } = {},
) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/",
        component: DummyPage,
        meta: { title: options.menuTitle ?? "成员" },
      },
    ],
  });
  await router.push("/");
  await router.isReady();
  return mount(InPageHeader, {
    props: options.props,
    slots: options.slots,
    global: {
      plugins: [router],
      stubs: { InIcon: true },
    },
  });
};

describe("InPageHeader", () => {
  it("渲染标题、说明和操作插槽", async () => {
    const wrapper = await mountHeader({
      props: { title: "成员管理", description: "管理组织成员" },
      slots: {
        action: "<button>新建</button>",
      },
    });
    expect(wrapper.get(".in-page-header__title").text()).toBe("成员管理");
    expect(wrapper.get(".in-page-header__description").text()).toBe("管理组织成员");
    expect(wrapper.get(".in-page-header__actions").text()).toBe("新建");
    wrapper.unmount();
  });

  it("未传 title 时使用当前路由菜单名", async () => {
    const wrapper = await mountHeader({ menuTitle: "部门" });
    expect(wrapper.get(".in-page-header__title").text()).toBe("部门");
    wrapper.unmount();
  });

  it("无说明时不预留副标题高度", async () => {
    const wrapper = await mountHeader({ menuTitle: "部门" });
    expect(wrapper.get(".in-page-header").classes()).not.toContain("has-description");
    expect(wrapper.find(".in-page-header__description").exists()).toBe(false);
    wrapper.unmount();
  });

  it("有说明时使用完整页面头高度", async () => {
    const wrapper = await mountHeader({
      props: { description: "按部门查看成员" },
    });
    expect(wrapper.get(".in-page-header").classes()).toContain("has-description");
    expect(wrapper.find(".in-page-header__description").exists()).toBe(true);
    wrapper.unmount();
  });

  it("显式 title 覆盖菜单名", async () => {
    const wrapper = await mountHeader({
      menuTitle: "部门",
      props: { title: "应用详情" },
    });
    expect(wrapper.get(".in-page-header__title").text()).toBe("应用详情");
    wrapper.unmount();
  });

  it("subtitle 作为 description 的兼容别名", async () => {
    const wrapper = await mountHeader({
      props: { title: "概览", subtitle: "插件示例" },
    });
    expect(wrapper.get(".in-page-header__description").text()).toBe("插件示例");
    wrapper.unmount();
  });

  it("返回按钮发出 back 事件", async () => {
    const wrapper = await mountHeader({
      props: { title: "详情", showBack: true },
    });
    await wrapper.get(".in-page-header__back").trigger("click");
    expect(wrapper.emitted("back")).toHaveLength(1);
    wrapper.unmount();
  });

  it("主标题与说明使用 16/500 与 14/400，并单行省略", () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "InPageHeader.vue"),
      "utf8",
    );
    expect(source).toContain("font-size: var(--in-font-size-section-title)");
    expect(source).toContain("font-weight: var(--in-font-weight-section-title)");
    expect(source).toContain("font-size: var(--in-font-size-body)");
    expect(source).toContain("font-weight: var(--in-font-weight-body)");
    expect(source).toContain("word-break: break-all");
    expect(source).toContain("display: -webkit-box");
    expect(source).toContain("-webkit-line-clamp: 1");
    expect(source).not.toContain("font-size: var(--in-font-size-page-title)");
    expect(source).toContain(".in-page-header.has-description {");
    expect(source).toContain("min-height: var(--in-page-header-min-height)");
    expect(source).not.toMatch(
      /\.in-page-header \{[^}]*min-height: var\(--in-page-header-min-height\);/,
    );
  });
});
