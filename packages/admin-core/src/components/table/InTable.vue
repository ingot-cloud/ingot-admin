<template>
  <div class="in-table" :class="[`is-${density}`]">
    <div v-if="hasMeta" class="in-table__meta">
      <div v-if="slot.title" class="title">
        <slot name="title"></slot>
      </div>
      <div v-if="slot.summary || slot.subtitle" class="subtitle">
        <slot name="summary">
          <slot name="subtitle"></slot>
        </slot>
      </div>
    </div>

    <div v-if="hasTools" class="in-table__tools">
      <div class="in-table__tools-start">
        <slot name="tools-start">
          <slot name="toolbar"></slot>
        </slot>
      </div>
      <div class="in-table__tools-end">
        <slot name="tools-end"></slot>
      </div>
    </div>

    <div class="in-table__body">
      <el-table v-bind="{ ...$attrs, ...tableBind }" :ref="tableRef" v-loading="loading">
        <el-table-column v-for="item in headersEnable" :key="item.prop" v-bind="item">
          <template #default="scope">
            <slot
              v-if="item.type === 'expand'"
              :name="item.prop"
              :item="scope.row"
              :index="scope.$index"
            >
            </slot>
            <slot
              v-else-if="!item.type || item.type === 'default'"
              :name="item.prop"
              :item="scope.row"
              :index="scope.$index"
            >
              {{
                item.transform
                  ? item.transform(scope.row[String(item.prop)])
                  : scope.row[String(item.prop)]
              }}
            </slot>
          </template>
        </el-table-column>
        <template #empty>
          <slot v-if="feedback === 'error'" name="error">
            <el-empty :image="emptyIllustration" description="加载失败" />
          </slot>
          <slot v-else-if="feedback === 'unauthorized'" name="unauthorized">
            <el-empty :image="emptyIllustration" description="无访问权限" />
          </slot>
          <slot v-else-if="feedback === 'no-result'" name="empty">
            <el-empty :image="emptyIllustration" description="无搜索结果" />
          </slot>
          <slot v-else name="empty">
            <el-empty :image="emptyIllustration" description="暂无数据" />
          </slot>
        </template>
      </el-table>
    </div>

    <div v-if="page && page.total" class="in-table__pagination">
      <el-pagination
        :small="componentSize === 'small'"
        :current-page="current"
        :page-size="size"
        :total="total"
        :page-sizes="pageSize"
        background
        :layout="pageLayout"
        @size-change="privateHandleSizeChange"
        @current-change="privateHandleCurrentChange"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { InTableSlots, TableAPI, TableHeaderRecord } from "./types";
import { type InTableProps, DefaultProps } from "./props";
import { visibleHeaderProps } from "./columnVisibility";
import { emptyIllustration } from "./emptyIllustration";
import { useAppStateStore } from "@/stores/modules/app";
import { ElTable, type TableInstance } from "element-plus";
import "element-plus/theme-chalk/el-table.css";
import type { ComponentPublicInstance } from "vue";

defineOptions({
  name: "InTable",
  inheritAttrs: false,
});

type TableRow = NonNullable<InTableProps["data"]>[number];

const slot = defineSlots<InTableSlots<TableRow>>();
const props = withDefaults(defineProps<InTableProps>(), DefaultProps);
const emits = defineEmits<{
  handleSizeChange: [payload: { value: number; type: "size" }];
  handleCurrentChange: [payload: { value: number; type: "current" }];
  /** @deprecated InTable 不再内置刷新入口，待 rollout 清理页面监听后删除。 */
  refresh: [];
}>();
const { componentSize } = storeToRefs(useAppStateStore());

const hasMeta = computed(() => Boolean(slot.title || slot.subtitle || slot.summary));
const hasTools = computed(() =>
  Boolean(slot["tools-start"] || slot["tools-end"] || slot.toolbar),
);

const tableBind = computed(() => {
  const {
    headers: _headers,
    page: _page,
    loading: _loading,
    radioKey: _radioKey,
    hideSetting: _hideSetting,
    density: _density,
    feedback: _feedback,
    pageSize: _pageSize,
    pageLayout: _pageLayout,
    tableId: _tableId,
    height: _height,
    ...rest
  } = props;
  return {
    ...rest,
    height: props.height ?? "100%",
  };
});

const visibleFromHeaders = (headers: TableHeaderRecord[]) =>
  visibleHeaderProps(
    headers,
    headers.filter((item) => !item.hide).map((item) => String(item.prop ?? "")),
  );

const headersEnable = ref<Array<TableHeaderRecord>>(visibleFromHeaders(props.headers));

const current = ref(props.page.current);
const size = ref(props.page.size);
const total = ref(props.page.total);

watch(
  () => props.headers,
  (headers) => {
    headersEnable.value = visibleFromHeaders(headers);
  },
  { deep: true },
);
watch(
  () => props.page.size,
  (value) => {
    size.value = value;
  },
);
watch(
  () => props.page.current,
  (value) => {
    current.value = value;
  },
);
watch(
  () => props.page.total,
  (value) => {
    total.value = value;
  },
);

const privateHandleSizeChange = (val: number) => {
  emits("handleSizeChange", { value: val, type: "size" });
};
const privateHandleCurrentChange = (val: number) => {
  emits("handleCurrentChange", { value: val, type: "current" });
};

const tableInstance = shallowRef<TableInstance>();
const tableRef = (instance: Element | ComponentPublicInstance | null) => {
  tableInstance.value =
    instance && "clearSelection" in instance && "toggleRowSelection" in instance
      ? (instance as TableInstance)
      : undefined;
};

defineExpose<TableAPI<TableRow>>({
  clearSelection: () => tableInstance.value?.clearSelection(),
  toggleRowSelection: (row, selected) => tableInstance.value?.toggleRowSelection(row, selected),
});
</script>
<style lang="postcss" scoped>
.in-table {
  @apply flex flex-col min-w-0 w-full;
  height: 100%;
  min-height: 0;
  padding: var(--in-space-5);
  gap: var(--in-space-5);
  box-sizing: border-box;
}

.in-table.is-compact {
  --in-table-row-height: var(--in-table-row-height-compact);
}

.in-table__meta {
  @apply flex flex-col;
  flex: none;
  gap: var(--in-space-1);
}

.in-table__tools {
  @apply flex flex-row items-center min-w-0;
  flex: none;
  gap: var(--in-space-3);
}

.in-table__tools-start {
  @apply flex items-center min-w-0;
  flex: none;
  gap: var(--in-space-3);
}

.in-table__tools-end {
  @apply flex items-center justify-end min-w-0;
  flex: 1;
  gap: var(--in-space-3);
}

.in-table__body {
  width: 100%;
  min-width: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

:deep(.hidden-columns) {
  visibility: hidden;
  position: absolute;
  z-index: -1;
}

.in-table__pagination {
  @apply flex flex-row justify-end items-start;
  flex: none;
}

:deep(.el-table) {
  --el-table-header-bg-color: var(--in-table-header-bg);
  --el-table-header-text-color: var(--in-table-header-text);
  --el-table-border-color: var(--in-border-color);
  --el-table-row-hover-bg-color: var(--in-bg-color-hover);
  height: 100%;
}

:deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 2;
}

:deep(.el-table .el-table-fixed-column--right.is-first-column) {
  box-shadow: -8px 0 8px -8px rgba(31, 35, 41, 0.12);
}

:deep(.el-table .el-table-fixed-column--left.is-last-column) {
  box-shadow: 8px 0 8px -8px rgba(31, 35, 41, 0.12);
}

:deep(th.el-table__cell) {
  height: var(--in-table-header-height);
  padding: 0 12px;
  font-weight: 500;
  color: var(--in-table-header-text);
  background: var(--in-table-header-bg);
}

:deep(td.el-table__cell) {
  height: var(--in-table-row-height);
  padding: 0 12px;
  border-bottom-color: var(--in-border-color);
}

:deep(.el-table .cell:has(.in-status-tag)) {
  overflow: visible;
}

:deep(th.el-table__cell.is-leaf) {
  border-bottom: none;
}

.title {
  color: var(--in-text-color);
  font-weight: var(--in-font-weight-section-title);
  font-size: var(--in-font-size-section-title);
  line-height: var(--in-line-height-section-title);
}

.subtitle {
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}
</style>
