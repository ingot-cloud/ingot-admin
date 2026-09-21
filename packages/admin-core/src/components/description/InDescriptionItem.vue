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
  gap: var(--in-space-2);
  min-width: 0;
}

.in-description-item__label {
  display: block;
  min-height: var(--in-line-height-body);
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  letter-spacing: 0;
  transition: color 0.3s ease-in-out;
}

.in-description-item__value {
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  letter-spacing: 0;
  overflow-x: auto;
  border-radius: var(--in-radius-control);
}
</style>
