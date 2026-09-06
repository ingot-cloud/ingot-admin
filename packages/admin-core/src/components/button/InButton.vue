<template>
  <el-button
    v-bind="$attrs"
    :loading="isLoading"
    :disabled="isDisabled"
    @click="privateOnClick"
  >
    <span v-if="slots.icon"> <slot name="icon"> </slot> </span>
    <slot></slot>
  </el-button>
</template>
<script lang="ts" setup>
defineOptions({
  name: "InButton",
  inheritAttrs: false,
});

/**
 * `click`：ElButton 原生点击，不节流。
 * `in-click`：长期公开 API，1200ms 节流，用于防重复提交。
 */
const props = defineProps<{
  loading?: unknown;
  disabled?: unknown;
}>();
const slots = useSlots();
const emits = defineEmits<{
  "in-click": [event: MouseEvent];
}>();
const isLoading = computed(() => Boolean(unref(props.loading)));
const isDisabled = computed(() => Boolean(unref(props.disabled)));
const triggerClick = useThrottleFn((e: MouseEvent) => {
  emits("in-click", e);
}, 1200);
const privateOnClick = (e: MouseEvent) => {
  if (isDisabled.value || isLoading.value) {
    return;
  }
  triggerClick(e);
};
</script>
