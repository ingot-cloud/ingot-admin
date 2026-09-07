<template>
  <div class="in-table-skeleton" role="status" aria-live="polite" aria-label="加载中">
    <div v-for="row in rows" :key="row" class="in-table-skeleton__row">
      <div
        v-for="(column, index) in columns"
        :key="String(column.prop ?? index)"
        class="in-table-skeleton__cell"
        :class="{ 'is-control': isControlColumn(column) }"
      >
        <span class="in-table-skeleton__bar" />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { TableHeaderRecord } from "./types";

defineOptions({
  name: "InTableSkeleton",
});

withDefaults(
  defineProps<{
    columns?: Array<TableHeaderRecord>;
    rows?: number;
  }>(),
  {
    columns: () => [],
    rows: 8,
  },
);

const isControlColumn = (column: TableHeaderRecord): boolean =>
  column.type === "selection" || column.type === "index" || column.type === "expand";
</script>
<style lang="postcss" scoped>
.in-table-skeleton {
  width: 100%;
  box-sizing: border-box;
}

.in-table-skeleton__row {
  display: flex;
  align-items: center;
  height: var(--in-table-row-height);
  padding: 0 12px;
  gap: 12px;
  border-bottom: 1px solid var(--in-border-color);
  box-sizing: border-box;
}

.in-table-skeleton__cell {
  min-width: 0;
  flex: 1;
}

.in-table-skeleton__cell.is-control {
  flex: none;
  width: 24px;
}

.in-table-skeleton__bar {
  display: block;
  width: 64%;
  max-width: 168px;
  height: 12px;
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-muted);
}

.in-table-skeleton__cell:nth-child(even) .in-table-skeleton__bar {
  width: 48%;
}

.in-table-skeleton__cell.is-control .in-table-skeleton__bar {
  width: 16px;
  max-width: 16px;
  height: 16px;
}

@media (prefers-reduced-motion: no-preference) {
  .in-table-skeleton__bar {
    background: linear-gradient(
      90deg,
      var(--in-bg-color-muted) 25%,
      var(--in-gray-200) 37%,
      var(--in-bg-color-muted) 63%
    );
    background-size: 400% 100%;
    animation: in-table-skeleton-shimmer 1.4s ease infinite;
  }
}

@keyframes in-table-skeleton-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
