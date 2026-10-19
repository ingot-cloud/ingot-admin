<template>
  <div
    v-if="hasMore || loading || failed"
    class="organization-picker-more"
    :data-picker-more="kind"
    :aria-busy="loading"
    aria-live="polite"
  >
    <in-button
      type="primary"
      link
      :loading="loading"
      :disabled="loading"
      :aria-label="failed ? `${label}失败，重试` : label"
      @in-click="failed ? emits('retry') : emits('more')"
      >{{ loading ? "加载中" : failed ? "加载失败，重试" : label }}</in-button
    >
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    hasMore: boolean;
    loading?: boolean;
    failed?: boolean;
    label?: string;
    kind: "members" | "departments" | "selected";
  }>(),
  { label: "加载更多" },
);
const emits = defineEmits<{ more: []; retry: [] }>();
</script>
<style lang="postcss" scoped>
.organization-picker-more {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin: 8px 8px 4px;
  padding: 6px 0;
  box-sizing: border-box;
}
.organization-picker-more :deep(.el-button) {
  min-width: 104px;
  min-height: 28px;
  margin: 0;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 400;
}
.organization-picker-more :deep(.el-button:not(:disabled):hover) {
  background: var(--in-bg-color-hover);
}
.organization-picker-more[aria-busy="true"] :deep(.el-button.is-loading) {
  color: var(--in-text-color-secondary);
}
.organization-picker-more[aria-busy="true"] :deep(.el-button.is-loading::before) {
  display: none;
}
</style>
