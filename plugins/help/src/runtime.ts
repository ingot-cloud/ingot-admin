import { computed, inject, shallowRef, watch, type InjectionKey, type ShallowRef } from "vue";
import type { Router } from "vue-router";
import type { QueryClient } from "@tanstack/vue-query";
import { usePermissions, useRouterStore, useUserInfoStore, Message } from "@ingot/admin-core";
import type { HelpNavigation } from "@ingot/admin-common";
import { HELP_DOMAIN, HELP_ID, HELP_SCHEMA_VERSION, helpArticles } from "./models/help";
import type { HelpArticle, HelpCatalog, HelpEntry, HelpSearchPage } from "./models/help";
import type { HelpContentProvider } from "./content/types";

export interface HelpRuntime extends HelpNavigation {
  entry: HelpEntry;
  catalog: ShallowRef<HelpCatalog | undefined>;
  positions: Map<string, number>;
  scope(): string;
  loadCatalog(force?: boolean): Promise<HelpCatalog>;
  article(id: string): Promise<HelpArticle>;
  search(
    q: string,
    categoryId: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<HelpSearchPage>;
  image(id: string, version: string): Promise<string>;
  clearImages(): void;
  reset(): void;
  back(): Promise<void>;
}
export const helpRuntimeKey: InjectionKey<HelpRuntime> = Symbol("ingot.help.runtime");
export const useHelpRuntime = (): HelpRuntime => {
  const value = inject(helpRuntimeKey);
  if (!value) throw new Error("帮助中心尚未装配");
  return value;
};
const cancelled = (): DOMException => new DOMException("帮助身份或内容已变化", "AbortError");

/** 不接受外部返回地址；只保留本端的安全业务路径。 */
export function safeHelpReturn(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !/[\u0000-\u0020]|%2f|%5c/i.test(path) &&
    !/^\/(?:help|login|auth|oauth2|init)(?:[/?#]|$)/.test(path)
  );
}

export function createHelpRuntime(
  entry: HelpEntry,
  router: Router,
  queryClient: QueryClient,
  loadContent: () => Promise<HelpContentProvider>,
): HelpRuntime {
  const permissions = usePermissions(),
    user = useUserInfoStore();
  const catalog = shallowRef<HelpCatalog>();
  const positions = new Map<string, number>();
  let pending: Promise<HelpContentProvider> | undefined;
  let generation = 0,
    imageGeneration = 0;
  let returnTo: string | undefined;
  const scope = (): string =>
    [
      entry,
      permissions.contextEpoch,
      permissions.domain,
      permissions.accountId,
      permissions.memberId,
      permissions.tenantId,
    ].join(":");
  const available = computed(
    () =>
      permissions.domain === HELP_DOMAIN[entry] &&
      Boolean(permissions.memberId) &&
      !user.getIsInitPwd,
  );
  // 静态URL由浏览器管理缓存；离开文章时只使旧加载结果失效，无Blob资源需撤销。
  const clearImages = (): void => {
    imageGeneration += 1;
  };
  const reset = (): void => {
    generation += 1;
    pending = undefined;
    clearImages();
    catalog.value = undefined;
    positions.clear();
    void queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === "help" });
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === "help" });
  };
  watch(
    scope,
    () => {
      returnTo = undefined;
      reset();
    },
    { flush: "sync" },
  );
  watch(
    () => user.getIsInitPwd,
    (required) => {
      if (required) reset();
    },
    { flush: "sync" },
  );

  const read = async <T>(operation: (provider: HelpContentProvider) => Promise<T>): Promise<T> => {
    if (!available.value) throw cancelled();
    const initialScope = scope(),
      current = generation;
    if (!pending) {
      const loading = loadContent();
      pending = loading;
      void loading.catch(() => {
        if (pending === loading) pending = undefined;
      });
    }
    const provider = await pending;
    if (current !== generation || scope() !== initialScope || !available.value) throw cancelled();
    if (provider.domain !== HELP_DOMAIN[entry]) throw new Error("帮助内容与当前端不兼容");
    const result = await operation(provider);
    if (current !== generation || scope() !== initialScope || !available.value) throw cancelled();
    return result;
  };
  const loadCatalog = async (force = false): Promise<HelpCatalog> => {
    if (force) reset();
    if (!available.value) throw cancelled();
    if (catalog.value) return catalog.value;
    const value = await read((provider) => provider.catalog());
    if (
      value.schemaVersion !== HELP_SCHEMA_VERSION ||
      value.domain !== HELP_DOMAIN[entry] ||
      !value.contentVersion
    )
      throw new Error("帮助内容与当前端不兼容");
    catalog.value = value;
    return value;
  };
  const rememberReturn = (): void => {
    if (safeHelpReturn(router.currentRoute.value.fullPath))
      returnTo = router.currentRoute.value.fullPath;
  };
  const openArticle = async (id: string): Promise<void> => {
    rememberReturn();
    if (
      !HELP_ID.test(id) ||
      !helpArticles((await loadCatalog()).categories).some((article) => article.id === id)
    ) {
      Message.warning("当前端暂无对应说明");
      return;
    }
    await router.push({ name: "help.article", params: { articleId: id } });
  };
  const runtime: HelpRuntime = {
    entry,
    catalog,
    positions,
    scope,
    loadCatalog,
    clearImages,
    reset,
    openArticle,
    openHome: async () => {
      rememberReturn();
      await router.push("/help");
    },
    openForView: async (viewPath) => {
      rememberReturn();
      const binding = (await loadCatalog()).pageBindings.find((item) => item.viewPath === viewPath);
      if (binding) await openArticle(binding.articleId);
      else Message.warning("当前功能的说明暂不可用");
    },
    article: async (id) => {
      const currentCatalog = await loadCatalog();
      if (!helpArticles(currentCatalog.categories).some((article) => article.id === id))
        throw new Error("当前端没有此说明");
      const value = await read((provider) => provider.article(id));
      if (
        value.domain !== HELP_DOMAIN[entry] ||
        value.contentVersion !== catalog.value?.contentVersion
      )
        throw cancelled();
      return value;
    },
    search: async (q, categoryId, page, pageSize) => {
      await loadCatalog();
      const value = await read((provider) => provider.search(q, categoryId, page, pageSize));
      if (
        value.domain !== HELP_DOMAIN[entry] ||
        value.contentVersion !== catalog.value?.contentVersion
      )
        throw cancelled();
      return value;
    },
    image: async (id, version) => {
      if (!HELP_ID.test(id) || version !== catalog.value?.contentVersion) throw cancelled();
      const imageEpoch = imageGeneration;
      const url = await read((provider) => provider.image(id));
      if (imageEpoch !== imageGeneration || version !== catalog.value?.contentVersion)
        throw cancelled();
      if (!url.startsWith("/") || url.startsWith("//") || url.includes("\\"))
        throw new Error("帮助配图必须属于当前站点");
      return url;
    },
    back: async () => {
      const firstMenu = (
        menus: ReturnType<typeof useRouterStore>["getMenus"],
      ): string | undefined => {
        for (const item of menus) {
          const child = item.children?.length ? firstMenu(item.children) : undefined;
          if (child) return child;
          if (!item.children?.length && item.path && safeHelpReturn(item.path)) return item.path;
        }
        return undefined;
      };
      await router.push(
        returnTo && safeHelpReturn(returnTo)
          ? returnTo
          : (firstMenu(useRouterStore().getMenus) ?? "/"),
      );
    },
  };
  router.beforeEach((to, from) => {
    const container = document.querySelector<HTMLElement>("[data-help-scroll]");
    if (from.path.startsWith("/help") && container)
      positions.set(from.fullPath, container.scrollTop);
    if (
      from.name === "help.article" &&
      (to.name !== from.name || to.params.articleId !== from.params.articleId)
    )
      clearImages();
    return true;
  });
  return runtime;
}
