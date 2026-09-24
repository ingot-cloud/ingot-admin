<template>
  <button
    type="button"
    class="in-close-button"
    :class="{ 'is-sm': size === 'sm' }"
    :aria-label="label"
    @click.stop="emits('click', $event)"
  >
    <icon-close-outlined />
  </button>
</template>
<script lang="ts" setup>
import IconCloseOutlined from "./icons/IconCloseOutlined.vue";

defineOptions({
  name: "InCloseButton",
});

withDefaults(
  defineProps<{
    label?: string;
    size?: "sm" | "default";
  }>(),
  {
    label: "关闭",
    size: "default",
  },
);

const emits = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>
<style lang="postcss" scoped>
.in-close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--in-text-color-secondary);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.in-close-button.is-sm {
  width: 16px;
  height: 16px;
  font-size: 12px;
}

.in-close-button:hover {
  background: var(--in-bg-color-control-hover);
  color: var(--in-text-color);
}
</style>
