<template>
  <div class="help-markdown" @click="privateLink">
    <template v-for="(block, index) in blocks" :key="index">
      <div v-if="block.kind === 'html'" v-html="block.html" />
      <BizHelpFigure
        v-else
        :asset="block.image"
        :version="article.contentVersion"
        @preview="$emit('preview', $event)"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { renderHelpMarkdown } from "../../../markdown";
import { helpArticles, type HelpArticle } from "../../../models/help";
import { useHelpRuntime } from "../../../runtime";
import BizHelpFigure from "./BizHelpFigure.vue";
const props = defineProps<{ article: HelpArticle }>();
const emit = defineEmits<{ preview: [id: string]; navigate: [id: string] }>();
const runtime = useHelpRuntime(),
  router = useRouter();
const blocks = computed(() =>
  renderHelpMarkdown(
    props.article,
    new Set(helpArticles(runtime.catalog.value?.categories ?? []).map((item) => item.id)),
  ),
);
const privateLink = (event: MouseEvent): void => {
  const anchor = event.target instanceof Element ? event.target.closest("a") : null;
  const href = anchor?.getAttribute("href");
  if (!href || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  if (href.startsWith("#")) {
    event.preventDefault();
    emit("navigate", href.slice(1));
  } else if (href.startsWith("/help/")) {
    event.preventDefault();
    void router.push(href);
  }
};
</script>
