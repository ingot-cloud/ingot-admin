<template>
  <span class="in-icon">
    <svg v-if="isInIcon" aria-hidden="true">
      <use :xlink:href="`#${prefix}-${icon}`" />
    </svg>
    <Icon v-else-if="icon" :icon="icon" />
  </span>
</template>
<script lang="ts" setup>
import { Icon } from "virtual:ingot-iconify-icon";

defineOptions({
  name: "InIcon",
});

const props = defineProps<{
  name: String | undefined;
}>();

const prefix = import.meta.env.VITE_APP_SYMBOL;

const isInIcon = computed(() => props.name && props.name.startsWith(`${prefix}:`));
const icon = computed(() => {
  if (props.name && props.name.startsWith(`${prefix}:`)) {
    return props.name.split(":")[1] as string;
  }
  return props.name as string;
});
</script>
