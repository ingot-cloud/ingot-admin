<template>
  <img
    v-if="isCatalogImageIcon(value)"
    :src="value"
    class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)] rounded-4px object-cover shrink-0"
    alt=""
  />
  <in-icon
    v-else-if="value"
    :name="value"
    class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)] shrink-0"
  />
</template>

<script setup lang="ts">
import { isCatalogImageIcon } from "../catalogIcon";

defineOptions({ name: "CatalogIconPreview" });

defineProps<{
  value?: string;
}>();
</script>
