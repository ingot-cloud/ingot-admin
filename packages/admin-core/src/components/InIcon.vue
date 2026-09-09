<template>
  <span class="in-icon">
    <svg v-if="isInIcon" aria-hidden="true">
      <use :xlink:href="`#${prefix}-${icon}`" />
    </svg>
    <Icon v-else-if="icon" :icon="icon" />
  </span>
</template>
<script lang="ts" setup>
import { computed, watch } from "vue";
import { Icon } from "virtual:ingot-iconify-icon";
import { getAdminRuntimeConfig } from "@/runtime";
import { recordIconifyUsed } from "./recordIconifyUsed";

defineOptions({
  name: "InIcon",
});

const props = defineProps<{
  name?: string;
}>();

const prefix = computed(() => getAdminRuntimeConfig().branding.symbol);

const isInIcon = computed(() => Boolean(props.name?.startsWith(`${prefix.value}:`)));
const icon = computed(() => {
  if (props.name?.startsWith(`${prefix.value}:`)) {
    return props.name.split(":")[1] ?? "";
  }
  return props.name ?? "";
});

watch(
  () => props.name,
  (name) => {
    if (!name || isInIcon.value) {
      return;
    }
    void recordIconifyUsed(name);
  },
  { immediate: true },
);
</script>
