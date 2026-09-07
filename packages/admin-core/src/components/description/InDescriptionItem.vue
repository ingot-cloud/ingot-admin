<template>
  <div class="in-description-item">
    <div class="in-description-item__label">{{ label }}</div>
    <div class="in-description-item__value">
      <slot>{{ displayValue }}</slot>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { formatDescriptionValue } from "./formatDescriptionValue";

defineOptions({
  name: "InDescriptionItem",
});

const props = defineProps<{
  label: string;
  value?: unknown;
}>();

const displayValue = computed(() => formatDescriptionValue(props.value));
</script>
<style lang="postcss" scoped>
.in-description-item {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-1);
  min-width: 0;
}

.in-description-item__label {
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-caption);
}

.in-description-item__value {
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  word-break: break-all;
}
</style>
