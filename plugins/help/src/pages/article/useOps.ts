import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Message, useRouterStore } from "@ingot/admin-core";
import { helpArticles, helpCategoryTrail, type HelpArticle } from "../../models/help";
import { safeHelpReturn, useHelpRuntime } from "../../runtime";
import { restoreHelpPosition } from "../../hooks/scroll";
import { renderHelpMarkdown } from "../../markdown";
import { ARTICLE_NOT_FOUND } from "./table";

interface HelpMenu {
  path: string;
  title?: string;
  viewPath?: string;
  children?: HelpMenu[];
}

export const useOps = () => {
  const runtime = useHelpRuntime(),
    route = useRoute(),
    router = useRouter();
  const article = shallowRef<HelpArticle>();
  const loading = ref(true),
    error = ref<string>(),
    activeHeading = ref<string>(),
    previewIndex = ref(-1);
  const tocOpen = ref(false);
  let ticket = 0,
    observer: IntersectionObserver | undefined;
  const privateObserve = async (): Promise<void> => {
    await nextTick();
    observer?.disconnect();
    const root = document.querySelector<HTMLElement>("[data-help-scroll]");
    if (!root || !article.value) return;
    observer = new IntersectionObserver(
      () => {
        const edge = root.getBoundingClientRect().top + 100;
        const headings = article.value?.toc ?? [];
        const preceding = headings.filter(
          (heading) =>
            (document.getElementById(heading.id)?.getBoundingClientRect().top ?? Infinity) <= edge,
        );
        activeHeading.value = preceding[preceding.length - 1]?.id ?? headings[0]?.id;
      },
      { root, rootMargin: "-24px 0px -65% 0px", threshold: [0, 1] },
    );
    article.value.toc.forEach((heading) => {
      const target = document.getElementById(heading.id);
      if (target) observer?.observe(target);
    });
  };
  const load = async (): Promise<void> => {
    const current = ++ticket;
    article.value = undefined;
    error.value = undefined;
    loading.value = true;
    previewIndex.value = -1;
    observer?.disconnect();
    runtime.clearImages();
    try {
      const id = String(route.params.articleId);
      const ids = new Set(
        helpArticles(runtime.catalog.value?.categories ?? []).map((item) => item.id),
      );
      if (!ids.has(id)) throw new Error(ARTICLE_NOT_FOUND);
      const response = await runtime.article(id);
      renderHelpMarkdown(response, ids);
      if (current !== ticket) return;
      article.value = response;
      // 先渲染正文，再建立观察器和恢复锚点，不能在骨架仍显示时查找章节DOM。
      loading.value = false;
      await privateObserve();
      await restoreHelpPosition(runtime, route.fullPath);
    } catch (failure) {
      if (current === ticket && !(failure instanceof DOMException && failure.name === "AbortError"))
        error.value = failure instanceof Error ? failure.message : "无法加载说明";
    } finally {
      if (current === ticket) loading.value = false;
    }
  };
  watch(() => [route.params.articleId, runtime.catalog.value?.contentVersion], load, {
    immediate: true,
  });
  const navigate = async (id: string): Promise<void> => {
    if (!article.value?.toc.some((heading) => heading.id === id)) return;
    activeHeading.value = id;
    tocOpen.value = false;
    if (route.hash !== `#${id}`) await router.push({ ...route, hash: `#${id}` });
    const target = document.getElementById(id);
    target?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };
  watch(
    () => route.hash,
    (hash) => {
      if (hash && article.value) void restoreHelpPosition(runtime, route.fullPath);
    },
  );
  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${router.resolve(route).fullPath}`,
      );
      Message.success("已复制文章链接");
    } catch {
      Message.warning("暂时无法复制，请复制浏览器地址栏中的链接");
    }
  };
  const targets = computed(() => {
    const flatten = (items: HelpMenu[]): HelpMenu[] =>
      items.flatMap((item) => [
        ...(item.children?.length ? [] : [item]),
        ...flatten(item.children ?? []),
      ]);
    return flatten(useRouterStore().getMenus)
      .filter(
        (item) =>
          safeHelpReturn(item.path) &&
          article.value?.relatedViewPaths.includes(item.viewPath ?? ""),
      )
      .map((item) => ({ path: item.path, name: item.title }));
  });
  const preview = (id: string): void => {
    previewIndex.value = article.value?.assets.findIndex((item) => item.id === id) ?? -1;
  };
  onBeforeUnmount(() => {
    ticket += 1;
    observer?.disconnect();
    runtime.clearImages();
    article.value = undefined;
  });
  return {
    article,
    loading,
    error,
    activeHeading,
    navigate,
    copyLink,
    previewIndex,
    preview,
    targets,
    tocOpen,
    load,
    trail: computed(() =>
      helpCategoryTrail(runtime.catalog.value?.categories ?? [], article.value?.categoryId ?? ""),
    ),
  };
};
