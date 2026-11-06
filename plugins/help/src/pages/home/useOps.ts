import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { helpArticles } from "../../models/help";
import { useHelpRuntime } from "../../runtime";
import { restoreHelpPosition } from "../../hooks/scroll";
export const useOps = () => {
  const runtime = useHelpRuntime(),
    route = useRoute();
  const all = computed(() => helpArticles(runtime.catalog.value?.categories ?? []));
  const select = (ids: string[]) =>
    all.value
      .filter((article) => ids.includes(article.id))
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  const quick = computed(() => select(runtime.catalog.value?.quickStartArticleIds ?? []));
  const faq = computed(() => select(runtime.catalog.value?.faqArticleIds ?? []));
  const recent = computed(() => select(runtime.catalog.value?.recentArticleIds ?? []));
  onMounted(() => {
    void restoreHelpPosition(runtime, route.fullPath);
  });
  return {
    categories: computed(() => runtime.catalog.value?.categories ?? []),
    quick,
    faq,
    recent,
  };
};
