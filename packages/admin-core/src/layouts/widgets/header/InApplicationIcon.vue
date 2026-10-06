<template>
  <img v-if="imageUrl && !failed" :src="imageUrl" alt="" class="in-application-icon" @error="failed = true" />
  <in-icon v-else :name="failed || imageUrl || !icon ? 'ep:monitor' : icon" class="in-application-icon" />
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getIcon, loadIcon } from "virtual:ingot-iconify-icon";
import { getAdminRuntimeConfig } from "@/runtime";
const props = defineProps<{ icon?: string }>();
const failed = ref(false);
const imageUrl = computed(() => {
  if (!props.icon) return undefined;
  try {
    const url = new URL(props.icon);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch { return undefined; }
});
let generation = 0;
watch(() => props.icon, async (icon) => {
  const current = ++generation;
  failed.value = false;
  if (!icon || imageUrl.value || icon.startsWith(`${getAdminRuntimeConfig().branding.symbol}:`) || getIcon(icon)) return;
  try {
    await loadIcon(icon);
    if (current === generation) failed.value = !getIcon(icon);
  } catch {
    if (current === generation) failed.value = true;
  }
}, { immediate: true });
</script>
<style scoped>
.in-application-icon { width: 1em; height: 1em; object-fit: contain; flex-shrink: 0; }
</style>
