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
  height: var(--in-copyright-hieght);
  font-size: 12px;
  color: rgba(23, 26, 29, 0.24);
  padding: 0 var(--in-common-padding) 8px;
}
</style>
