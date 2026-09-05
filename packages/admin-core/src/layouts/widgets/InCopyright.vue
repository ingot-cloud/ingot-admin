<template>
  <div class="in-copyright">{{ app.copyright }}</div>
</template>
<script setup lang="ts">
import { useAppStore } from "@/stores/modules/app";
const { app } = useAppStore();
</script>
<style lang="postcss" scoped>
.in-copyright {
  box-sizing: border-box;
  height: var(--in-copyright-height);
  font-size: 12px;
  color: var(--in-text-color-placeholder);
  padding: 8px var(--in-common-padding) 8px;
}
</style>
