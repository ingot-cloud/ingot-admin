import { describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import InPageFrame from "./InPageFrame.vue";

const Page = defineComponent({
  render: () => h("div", "page"),
});

const mountFrame = async (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: Page }],
  });
  await router.push("/");
  await router.isReady();
  return mount(InPageFrame, {
    props,
    slots,
    global: {
      plugins: [router],
      stubs: { ElBacktop: true },
    },
  });
};

describe("InPageFrame", () => {
  it("默认 page 模式由 body 滚动，滑到底保留画布沟槽", async () => {
    const wrapper = await mountFrame();
    expect(wrapper.get(".in-page-frame").classes()).toContain("is-page");
    expect(wrapper.get(".in-page-frame__body").classes()).toContain("is-page");
    expect(wrapper.get(".in-page-frame__body").classes()).toContain("is-scrollable");
    wrapper.unmount();
  });

  it("contained 模式隐藏 body 滚动并把高度交给内部组件", async () => {
    const wrapper = await mountFrame({ mode: "contained", surface: "workspace" });
    expect(wrapper.get(".in-page-frame").classes()).toContain("is-contained");
    expect(wrapper.get(".in-page-frame").classes()).toContain("is-workspace");
    expect(wrapper.get(".in-page-frame__body").classes()).toContain("is-contained");
    expect(wrapper.get(".in-page-frame__body").classes()).not.toContain("is-scrollable");
    wrapper.unmount();
  });

  it("渲染 header 与 tabs 固定区", async () => {
    const wrapper = await mountFrame(
      {},
      {
        header: "<h1>标题</h1>",
        tabs: "<nav>tabs</nav>",
        default: "<p>正文</p>",
      },
    );
    expect(wrapper.get(".in-page-frame__header").text()).toBe("标题");
    expect(wrapper.get(".in-page-frame__tabs").text()).toBe("tabs");
    expect(wrapper.get(".in-page-frame__body").text()).toContain("正文");
    await nextTick();
    wrapper.unmount();
  });
});
