<template>
  <form
    class="help-search"
    :class="{ 'is-large': large }"
    role="search"
    @submit.prevent="privateSubmit"
  >
    <InIcon name="ep:search" aria-hidden="true" />
    <input
      v-model="keyword"
      type="search"
      aria-label="搜索帮助说明"
      placeholder="搜索功能或使用问题"
      maxlength="100"
      @compositionstart="composing = true"
      @compositionend="composing = false"
    />
    <button
      v-if="keyword"
      type="button"
      class="help-search-clear"
      aria-label="清空搜索"
      @click="privateClear"
    >
      ×
    </button>
    <button type="submit" class="help-search-submit" aria-label="搜索帮助说明">搜索</button>
  </form>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

defineProps<{ large?: boolean }>();
const route = useRoute(),
  router = useRouter();
const keyword = ref(typeof route.query.q === "string" ? route.query.q : "");
const composing = ref(false);
watch(
  () => route.query.q,
  (q) => {
    keyword.value = typeof q === "string" ? q : "";
  },
);
const privateSubmit = (): void => {
  if (composing.value) return;
  const q = keyword.value.trim();
  if (!q) return;
  void router.push({
    name: "help.search",
    query: { q, categoryId: route.query.categoryId, page: "1" },
  });
};
const privateClear = (): void => {
  keyword.value = "";
  void router.push("/help");
};
</script>
