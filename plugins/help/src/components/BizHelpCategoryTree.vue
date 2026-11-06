<template>
  <nav class="help-category-nav" aria-label="帮助分类">
    <RouterLink to="/help" class="help-directory-home"
      ><InIcon name="ep:house" />帮助中心首页</RouterLink
    >
    <el-tree
      ref="tree"
      :data="nodes"
      node-key="key"
      :current-node-key="currentKey"
      :default-expanded-keys="expandedKeys"
      :expand-on-click-node="false"
      :highlight-current="true"
      :props="{ label: 'title', children: 'children' }"
      @node-click="privateSelect"
    >
      <template #default="{ data }">
        <RouterLink
          :to="
            data.articleId
              ? { name: 'help.article', params: { articleId: data.articleId } }
              : { name: 'help.category', params: { categoryId: data.categoryId } }
          "
          :aria-current="currentKey === data.key ? 'page' : undefined"
          class="help-tree-link"
          >{{ data.title }}</RouterLink
        >
      </template>
    </el-tree>
  </nav>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { helpArticles, helpCategoryTrail, type HelpCategory } from "../models/help";
import { useHelpRuntime } from "../runtime";
interface TreeItem {
  key: string;
  title: string;
  categoryId: string;
  articleId?: string;
  children?: TreeItem[];
}
interface TreeHandle {
  getNode(key: string): { expanded: boolean } | undefined;
  setCurrentKey(key: string | undefined): void;
}
const runtime = useHelpRuntime(),
  route = useRoute(),
  router = useRouter();
const tree = ref<TreeHandle>();
const asNodes = (categories: HelpCategory[]): TreeItem[] =>
  categories.map((item) => ({
    key: `category:${item.id}`,
    title: item.title,
    categoryId: item.id,
    children: [
      ...asNodes(item.children),
      ...item.articles.map((article) => ({
        key: `article:${article.id}`,
        title: article.title,
        articleId: article.id,
        categoryId: item.id,
      })),
    ],
  }));
const nodes = computed(() => asNodes(runtime.catalog.value?.categories ?? []));
const currentCategory = computed(() =>
  route.name === "help.article"
    ? helpArticles(runtime.catalog.value?.categories ?? []).find(
        (article) => article.id === route.params.articleId,
      )?.categoryId
    : String(route.params.categoryId ?? route.query.categoryId ?? ""),
);
const currentKey = computed(() =>
  route.name === "help.article"
    ? `article:${String(route.params.articleId)}`
    : `category:${currentCategory.value}`,
);
const expandedKeys = computed(() =>
  helpCategoryTrail(runtime.catalog.value?.categories ?? [], currentCategory.value ?? "").map(
    (item) => `category:${item.id}`,
  ),
);
watch(
  [currentKey, nodes],
  async () => {
    await nextTick();
    expandedKeys.value.forEach((key) => {
      const node = tree.value?.getNode(key);
      if (node) node.expanded = true;
    });
    const selected = tree.value?.getNode(currentKey.value);
    tree.value?.setCurrentKey(selected ? currentKey.value : undefined);
    await nextTick();
    document.querySelector(".help-category-nav .is-current")?.scrollIntoView({ block: "nearest" });
  },
  { immediate: true },
);
const privateSelect = (item: TreeItem): void => {
  void router.push(
    item.articleId
      ? { name: "help.article", params: { articleId: item.articleId } }
      : { name: "help.category", params: { categoryId: item.categoryId } },
  );
};
</script>
