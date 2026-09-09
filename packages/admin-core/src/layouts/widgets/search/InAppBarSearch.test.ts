import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import InAppBarSearch from "./InAppBarSearch.vue";
import { HEADER_SEARCH_DEBOUNCE_MS } from "./constants";
import { useRouterStore } from "@/stores/modules/router";
import { useUserInfoStore } from "@/stores/modules/auth";
import { useHeaderSearchStore } from "@/stores/modules/headerSearch";
import type { ResolvedHeaderSearchShortcut } from "../header/resolveHeaderConfig";

const Page = defineComponent({ render: () => h("div") });

const settleSearch = async () => {
  await vi.advanceTimersByTimeAsync(HEADER_SEARCH_DEBOUNCE_MS);
  await flushPromises();
};

const mountSearch = async (
  compact = false,
  shortcuts: ResolvedHeaderSearchShortcut[] = [],
) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: Page },
      { path: "/security/members", component: Page },
      { path: "/security/audit", component: Page },
      { path: "/org/dept", component: Page },
    ],
  });
  await router.push("/");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserInfoStore().userInfo.user = { phone: "13800001111" };
  useRouterStore().menus = [
    {
      path: "/security",
      title: "安全中心",
      children: [
        { path: "/security/members", title: "成员权限", icon: "ep:user" },
        { path: "/security/audit", title: "审计日志" },
      ],
    },
    { path: "/org/dept", title: "部门" },
  ];
  const wrapper = mount(InAppBarSearch, {
    props: { compact, shortcuts },
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      stubs: {
        InIcon: {
          props: ["name"],
          template: '<i class="in-icon" :data-name="name"></i>',
        },
        InLoadingMark: { template: '<img class="in-loading-mark" />' },
      },
    },
  });
  return { wrapper, router };
};

describe("InAppBarSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("聚焦打开面板，无常用时展示空态占位", async () => {
    const { wrapper, router } = await mountSearch();
    await wrapper.get("input").trigger("focus");
    await nextTick();
    expect(document.querySelector("[data-testid='app-bar-search-placeholder']")?.textContent).toContain(
      "输入关键词搜索功能导航",
    );
    expect(document.querySelector("[data-testid='app-bar-search-history']")).toBeNull();
    expect(document.body.textContent).toContain("↑↓ 移动光标 | Enter 选择条目");
    await wrapper.get("input").trigger("keydown", { key: "Enter" });
    expect(router.currentRoute.value.path).toBe("/");
    wrapper.unmount();
  });

  it("空关键词展示常用，Enter 打开当前项", async () => {
    const { wrapper, router } = await mountSearch(true, [
      { key: "dept", label: "部门", path: "/org/dept", icon: "ep:office-building" },
    ]);
    await wrapper.get("input").trigger("focus");
    await nextTick();
    expect(wrapper.get("[data-testid='app-bar-search-shortcuts']").text()).toContain("部门");
    await wrapper.get("input").trigger("keydown", { key: "Enter" });
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/org/dept");
    wrapper.unmount();
  });

  it("输入后先 loading，再展示匹配结果与主题色高亮", async () => {
    const { wrapper, router } = await mountSearch(true);
    const input = wrapper.get("input");
    await input.trigger("focus");
    await input.setValue("成员");
    await nextTick();
    expect(wrapper.find("[data-testid='app-bar-search-loading']").exists()).toBe(true);
    await settleSearch();
    const results = wrapper.get("[data-testid='app-bar-search-results']");
    expect(results.text()).toContain("功能");
    expect(results.text()).toContain("成员权限");
    expect(results.text()).toContain("安全中心");
    expect(results.get("em").text()).toBe("成员");
    await wrapper.get(".in-app-bar-search-hit").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/security/members");
    expect(useHeaderSearchStore().history).toEqual(["成员"]);
    expect(wrapper.find("[data-testid='app-bar-search-panel']").exists()).toBe(false);
    wrapper.unmount();
  });

  it("↑↓ 移动高亮后 Enter 打开当前项", async () => {
    const { wrapper, router } = await mountSearch(true);
    const input = wrapper.get("input");
    await input.trigger("focus");
    await input.setValue("安全");
    await settleSearch();
    const rows = wrapper.findAll(".in-app-bar-search-hit");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.classes()).toContain("is-active");
    await input.trigger("keydown", { key: "ArrowDown" });
    await nextTick();
    expect(rows[1]?.classes()).toContain("is-active");
    await input.trigger("keydown", { key: "Enter" });
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/security/audit");
    wrapper.unmount();
  });

  it("空输入展示历史胶囊，点击后立刻过滤，清空后隐藏历史", async () => {
    const { wrapper } = await mountSearch();
    useHeaderSearchStore().pushKeyword("部门");
    const input = wrapper.get("input");
    await input.trigger("focus");
    await nextTick();
    const history = document.querySelector("[data-testid='app-bar-search-history']");
    expect(history?.textContent).toContain("搜索历史");
    const chip = document.querySelector(".in-app-bar-search-panel__chip") as HTMLButtonElement;
    chip.click();
    await settleSearch();
    expect((input.element as HTMLInputElement).value).toBe("部门");
    expect(document.querySelector("[data-testid='app-bar-search-results']")?.textContent).toContain(
      "部门",
    );
    await input.setValue("");
    await nextTick();
    const clear = document.querySelector(
      "[aria-label='清空搜索历史']",
    ) as HTMLButtonElement | null;
    expect(clear).not.toBeNull();
    clear?.click();
    await nextTick();
    expect(document.querySelector("[data-testid='app-bar-search-history']")).toBeNull();
    expect(useHeaderSearchStore().history).toEqual([]);
    wrapper.unmount();
  });

  it("紧凑模式面板内联展开", async () => {
    const { wrapper } = await mountSearch(true);
    await wrapper.get("input").trigger("focus");
    await nextTick();
    expect(wrapper.get("[data-testid='app-bar-search-panel']").classes()).toContain("is-inline");
    wrapper.unmount();
  });
});
