import { describe, expect, it } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter, RouterView } from "vue-router";
import { useContentScroll } from "./useContentScroll";

const Page = defineComponent({
  render: () => h("div", "page"),
});

const Host = defineComponent({
  setup() {
    const target = ref<HTMLElement>();
    const scroll = useContentScroll(target);
    return { target, scroll };
  },
  render() {
    return h("div", [
      h("div", {
        ref: "target",
        class: "viewport",
        style: "height: 80px; overflow: hidden;",
      }, [
        h("div", {
          class: "in-page-frame__body is-page",
          style: "height: 80px; overflow: auto;",
        }, [h("div", { style: "height: 400px;" }, "content")]),
      ]),
      h(RouterView),
    ]);
  },
});

describe("useContentScroll", () => {
  it("切换路由时保存并恢复滚动位置", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/a", component: Page },
        { path: "/b", component: Page },
      ],
    });
    await router.push("/a");
    await router.isReady();
    const wrapper = mount(Host, {
      global: { plugins: [router] },
    });
    const el = wrapper.find(".in-page-frame__body").element as HTMLElement;
    Object.defineProperty(el, "scrollTop", { writable: true, value: 120, configurable: true });
    await router.push("/b");
    await nextTick();
    expect(el.scrollTop).toBe(0);
    await router.push("/a");
    await nextTick();
    expect(el.scrollTop).toBe(120);
    wrapper.unmount();
  });
});
