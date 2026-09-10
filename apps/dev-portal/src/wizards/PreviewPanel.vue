<template>
  <section class="preview">
    <h3>预览 {{ preview.targetDir }}</h3>
    <p>包名 {{ preview.packageName }}，指纹 {{ preview.fingerprint.slice(0, 12) }}…</p>
    <ul>
      <li v-for="file in preview.files" :key="file.path">
        {{ file.path }}
        <span v-if="file.kind === 'binary'">（二进制 {{ file.bytes }} bytes）</span>
        <span v-else>（{{ file.bytes }} bytes）</span>
      </li>
    </ul>
    <details v-for="file in textFiles" :key="file.path">
      <summary>{{ file.path }}</summary>
      <pre>{{ file.content }}</pre>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ScaffoldPreview } from "../api/client";

const props = defineProps<{ preview: ScaffoldPreview }>();

const textFiles = computed(() => props.preview.files.filter((file) => file.kind === "text").slice(0, 8));
</script>

<style scoped>
.preview {
  margin-top: 24px;
  color: var(--vp-c-text-1);
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 16px;
}
pre {
  overflow: auto;
  max-height: 240px;
  font-size: 12px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
</style>
