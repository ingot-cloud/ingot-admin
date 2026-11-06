import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { findHelpCategory, helpArticles } from "../../models/help";
import { useHelpRuntime } from "../../runtime";
import { restoreHelpPosition } from "../../hooks/scroll";
export const useOps = () => {
  const runtime = useHelpRuntime(),
    route = useRoute();
  const category = computed(() =>
    findHelpCategory(runtime.catalog.value?.categories ?? [], String(route.params.categoryId)),
  );
  const articles = computed(() => (category.value ? helpArticles([category.value]) : []));
  watch(
    () => route.fullPath,
    () => {
      void restoreHelpPosition(runtime, route.fullPath);
    },
    { immediate: true },
  );
  return { category, articles };
};
