import { beforeEach, describe, expect, it, vi } from "vitest";
import { shallowRef } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import type { HelpRuntime } from "../../runtime";
import type { HelpArticle, HelpCatalog } from "../../models/help";

const state = vi.hoisted(() => ({ runtime: {} as Partial<HelpRuntime> }));
vi.mock("../../runtime", () => ({
  useHelpRuntime: () => state.runtime,
  safeHelpReturn: () => true,
}));
vi.mock("@ingot/admin-core", () => ({
  Message: { success: vi.fn(), warning: vi.fn() },
  useRouterStore: () => ({ getMenus: [] }),
}));
const Page = (await import("./IndexPage.vue")).default;

describe("文章初次渲染后的章节定位", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("先移除骨架并渲染正文，再观察章节与恢复深链", async () => {
    const article: HelpArticle = {
      id: "tenant-test",
      title: "演示说明",
      summary: "章节验证",
      categoryId: "tenant-test-category",
      domain: "TENANT",
      contentVersion: "a".repeat(64),
      updatedAt: "2026-11-03T00:00:00Z",
      readMinutes: 1,
      audienceDescription: "演示成员",
      markdown: "## 操作步骤 {#steps}\n\n完成当前操作。",
      toc: [{ id: "steps", title: "操作步骤", level: 2 }],
      assets: [],
      relatedArticles: [],
      relatedViewPaths: [],
    };
    const catalog: HelpCatalog = {
      schemaVersion: 1,
      domain: "TENANT",
      contentVersion: article.contentVersion,
      productVersion: "test",
      categories: [
        {
          id: "tenant-test-category",
          title: "演示",
          description: "演示",
          icon: "ep:document",
          children: [],
          articles: [article],
        },
      ],
      quickStartArticleIds: [],
      faqArticleIds: [],
      recentArticleIds: [],
      pageBindings: [],
    };
    state.runtime = {
      catalog: shallowRef(catalog),
      positions: new Map(),
      article: async () => article,
      clearImages: vi.fn(),
      back: async () => {},
    };
    const observed: string[] = [],
      located: string[] = [];
    class Observer {
      observe(element: Element) {
        observed.push(element.id);
      }
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", Observer);
    const oldScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(function (this: Element) {
        located.push(this.id);
      }),
    });
    const container = document.createElement("main");
    container.dataset.helpScroll = "";
    document.body.append(container);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/help", name: "help.home", component: { template: "<div />" } },
        {
          path: "/help/categories/:categoryId",
          name: "help.category",
          component: { template: "<div />" },
        },
        { path: "/help/articles/:articleId", name: "help.article", component: Page },
      ],
    });
    await router.push("/help/articles/tenant-test#steps");
    await router.isReady();
    const wrapper = mount(Page, {
      attachTo: container,
      global: { plugins: [router], stubs: { InIcon: true } },
    });
    try {
      await flushPromises();
      expect(wrapper.find("#steps").exists()).toBe(true);
      expect(observed).toContain("steps");
      expect(located).toContain("steps");
    } finally {
      wrapper.unmount();
      container.remove();
      if (oldScroll) Object.defineProperty(Element.prototype, "scrollIntoView", oldScroll);
      else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
      vi.unstubAllGlobals();
    }
  });
});
