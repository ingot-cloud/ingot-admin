<template>
  <svg aria-hidden="true" v-if="isInIcon">
    <use :xlink:href="`#${prefix}-${icon}`" />
  </svg>
  <Icon v-else :icon="icon" />
</template>
<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { getAdminRuntimeConfig } from "@/runtime";

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
</script>
