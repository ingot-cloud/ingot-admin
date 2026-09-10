<template>
  <div class="demo-root">
    <InButtonDemo v-if="demoId === 'in-button'" />
    <InTitleDemo v-else-if="demoId === 'in-title'" />
    <InTagDemo v-else-if="demoId === 'in-tag'" />
    <InTableDemo v-else-if="demoId === 'in-table'" />
    <p v-else>未知演示：{{ demoId }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import InButtonDemo from "./cases/InButtonDemo.vue";
import InTableDemo from "./cases/InTableDemo.vue";
import InTagDemo from "./cases/InTagDemo.vue";
import InTitleDemo from "./cases/InTitleDemo.vue";

const hash = ref(window.location.hash);
const demoId = computed(() => hash.value.replace(/^#\/?/, "") || "in-button");

onMounted(() => {
  window.addEventListener("hashchange", () => {
    hash.value = window.location.hash;
  });
  const notify = () => {
    const height = Math.min(Math.max(document.documentElement.scrollHeight, 160), 720);
    window.parent?.postMessage({ type: "ingot-demo-resize", height }, window.location.origin);
  };
  notify();
  new ResizeObserver(notify).observe(document.body);
});
</script>

<style>
.demo-root {
  padding: 16px;
  font-family: Inter, "PingFang SC", sans-serif;
}
</style>
