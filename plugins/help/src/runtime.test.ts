import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, reactive, type EffectScope } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { QueryClient } from "@tanstack/vue-query";
import { flushPromises } from "@vue/test-utils";
import type { HelpArticle, HelpCatalog } from "./models/help";
import type { HelpContentProvider } from "./content/types";

const state = vi.hoisted(() => ({
  permissions: {} as Record<string, unknown>,
  user: {} as { getIsInitPwd?: boolean },
}));
vi.mock("@ingot/admin-core", () => ({
  usePermissions: () => state.permissions,
  useUserInfoStore: () => state.user,
  useRouterStore: () => ({ getMenus: [] }),
  Message: { warning: vi.fn() },
}));
const { createHelpRuntime, safeHelpReturn } = await import("./runtime");
const VERSION = "2026.11-static";
const catalog: HelpCatalog = {
  schemaVersion: 1,
  domain: "TENANT",
  contentVersion: VERSION,
  productVersion: VERSION,
  categories: [
    {
      id: "tenant-category",
      title: "组织",
      description: "演示",
      icon: "ep:user",
      children: [],
      articles: [
        {
          id: "tenant-members",
          title: "成员",
          summary: "说明",
          categoryId: "tenant-category",
          updatedAt: "2026-11-03T00:00:00Z",
          readMinutes: 1,
        },
      ],
    },
  ],
  quickStartArticleIds: ["tenant-members"],
  faqArticleIds: [],
  recentArticleIds: [],
  pageBindings: [],
};
const article: HelpArticle = {
  ...catalog.categories[0].articles[0],
  domain: "TENANT",
  contentVersion: VERSION,
  audienceDescription: "演示",
  markdown: "正文",
  toc: [],
  assets: [],
  relatedArticles: [],
  relatedViewPaths: [],
};
let scope: EffectScope;
let provider: HelpContentProvider;
let loadContent: ReturnType<typeof vi.fn<() => Promise<HelpContentProvider>>>;
const create = () =>
  scope.run(() =>
    createHelpRuntime(
      "tenant",
      createRouter({ history: createMemoryHistory(), routes: [] }),
      new QueryClient(),
      loadContent,
    ),
  )!;

describe("静态帮助的身份与内容来源", () => {
  beforeEach(() => {
    scope = effectScope();
    state.permissions = reactive({
      contextEpoch: 1,
      domain: "TENANT",
      accountId: "10",
      memberId: "11",
      tenantId: "20",
    });
    state.user = reactive({ getIsInitPwd: false });
    provider = {
      domain: "TENANT",
      catalog: vi.fn(async () => catalog),
      article: vi.fn(async () => article),
      image: vi.fn(async () => "/static/tenant-image.png"),
      search: vi.fn(),
    };
    loadContent = vi.fn(async () => provider);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("帮助读取不得调用网络API");
      }),
    );
  });
  afterEach(() => {
    scope.stop();
    vi.unstubAllGlobals();
  });
  it("只装配固定域提供器，拒绝其他域内容", async () => {
    loadContent.mockResolvedValue({ ...provider, domain: "PLATFORM" });
    const runtime = create();
    await expect(runtime.loadCatalog()).rejects.toThrow("不兼容");
    expect(runtime.catalog.value).toBeUndefined();
  });
  it("并发目录读取复用本地装配，不调用help API", async () => {
    const runtime = create();
    await Promise.all([runtime.loadCatalog(), runtime.loadCatalog()]);
    expect(loadContent).toHaveBeenCalledOnce();
    expect(await runtime.article("tenant-members")).toEqual(article);
    expect(await runtime.image("tenant-image", VERSION)).toBe("/static/tenant-image.png");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("切换组织清空目录与位置，旧文章不能回填", async () => {
    const runtime = create();
    await runtime.loadCatalog();
    let finish: ((value: HelpArticle) => void) | undefined;
    provider.article = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = runtime.article("tenant-members");
    await flushPromises();
    runtime.positions.set("/help", 120);
    state.permissions.contextEpoch = 2;
    finish?.(article);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(runtime.catalog.value).toBeUndefined();
    expect(runtime.positions.size).toBe(0);
  });
  it("文章离开后旧图片结果失效，静态URL不需要创建Blob", async () => {
    const runtime = create();
    await runtime.loadCatalog();
    let finish: ((value: string) => void) | undefined;
    provider.image = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = runtime.image("tenant-image", VERSION);
    await flushPromises();
    runtime.clearImages();
    finish?.("/static/tenant-image.png");
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
  it("强制改密或未知身份不加载静态说明，已读目录也立即清理", async () => {
    const runtime = create();
    await runtime.loadCatalog();
    state.user.getIsInitPwd = true;
    expect(runtime.catalog.value).toBeUndefined();
    await expect(runtime.loadCatalog()).rejects.toMatchObject({ name: "AbortError" });
    state.user.getIsInitPwd = false;
    state.permissions.memberId = undefined;
    await expect(runtime.loadCatalog()).rejects.toMatchObject({ name: "AbortError" });
    expect(loadContent).toHaveBeenCalledOnce();
  });
  it("跨端文章在当前目录拒绝；图片不能改用其他站点", async () => {
    const runtime = create();
    await expect(runtime.article("platform-accounts")).rejects.toThrow("当前端没有");
    expect(provider.article).not.toHaveBeenCalled();
    provider.image = vi.fn(async () => "https://other.example/image.png");
    await expect(runtime.image("tenant-image", VERSION)).rejects.toThrow("当前站点");
  });
  it("返回地址仅接受安全的当前端业务路径", () => {
    expect(safeHelpReturn("/org/iam/members?status=ACTIVE")).toBe(true);
    for (const path of [
      "//evil.example",
      "https://evil.example",
      "/%2f%2fevil.example",
      "/auth/start",
      "/help/articles/example",
      "/\\evil",
      "/\n/evil",
    ])
      expect(safeHelpReturn(path)).toBe(false);
  });
});
