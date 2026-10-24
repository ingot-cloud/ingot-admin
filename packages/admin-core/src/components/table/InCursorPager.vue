<template>
  <nav class="in-cursor-pager" aria-label="分页">
    <el-select
      class="w-110px!"
      :model-value="size"
      :disabled="disabled"
      aria-label="每页条数"
      @update:model-value="privateOnSizeChange"
    >
      <el-option v-for="item in pageSizes" :key="item" :label="`${item} 条/页`" :value="item" />
    </el-select>
    <el-button
      :icon="ArrowLeft"
      :disabled="disabled || !hasPrev"
      aria-label="上一页"
      @click="emit('prev')"
    />
    <span class="in-cursor-pager__page">第 {{ page }} 页</span>
    <el-button
      :icon="ArrowRight"
      :disabled="disabled || !hasNext"
      aria-label="下一页"
      @click="emit('next')"
    />
  </nav>
</template>
<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

defineOptions({ name: "InCursorPager" });

withDefaults(
  defineProps<{
    page: number;
    size: number;
    hasPrev: boolean;
    hasNext: boolean;
    disabled?: boolean;
    pageSizes?: number[];
  }>(),
  {
    disabled: false,
    pageSizes: () => [20, 30, 40, 50],
  },
);

const emit = defineEmits<{
  prev: [];
  next: [];
  "size-change": [size: number];
}>();

const privateOnSizeChange = (value: number): void => {
  emit("size-change", value);
};
</script>
<style lang="postcss" scoped>
.in-cursor-pager {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  gap: var(--in-space-2);
  min-height: 32px;
}

.in-cursor-pager__page {
  @apply text-13px;
  color: var(--in-text-color-secondary);
  min-width: 56px;
  text-align: center;
}
</style>
