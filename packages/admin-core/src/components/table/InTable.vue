<template>
  <div
    class="in-table"
    :class="[
      `is-${density}`,
      {
        'is-custom-tree': useCustomTree,
        'is-hide-header-selection': hideHeaderSelection,
        'is-header-selection-disabled': headerSelectionDisabled,
      },
    ]"
  >
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
      <el-table
        v-bind="{ ...$attrs, ...tableBind }"
        :ref="tableRef"
        v-loading="showOverlayLoading"
        @selection-change="privateOnElSelectionChange"
      >
        <el-table-column v-for="item in headersEnable" :key="item.prop" v-bind="item">
          <template v-if="showColumnHeader(item)" #header>
            <span v-if="isTreeColumn(item)" class="in-table-tree-cell">
              <el-checkbox
                v-if="treeHeaderCheckboxMode !== 'off'"
                :model-value="headerChecked"
                :indeterminate="headerIndeterminate"
                :disabled="treeHeaderCheckboxMode === 'disabled'"
                @change="privateOnHeaderCheck"
              />
              <slot :name="`${String(item.prop)}-header`" :item="item">
                {{ item.label }}
              </slot>
            </span>
            <slot v-else :name="`${String(item.prop)}-header`" :item="item" />
          </template>
          <template #default="scope">
            <in-table-tree-cell
              v-if="isTreeColumn(item)"
              :indent="treeIndentOf(scope.row)"
              :expandable="canExpandRow(scope.row)"
              :expanded="isRowExpanded(scope.row)"
              :checkbox-mode="rowCheckboxMode(scope.row)"
              :checked="isRowSelected(scope.row)"
              @toggle-expand="privateOnToggleExpand(scope.row)"
              @change="(checked) => privateOnToggleSelect(scope.row, checked)"
            >
              <slot
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
            </in-table-tree-cell>
            <slot
              v-else-if="item.type === 'expand'"
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
          <in-table-skeleton
            v-if="showSkeleton"
            :columns="headersEnable"
            :rows="skeletonRows"
          />
          <slot v-else-if="feedback === 'error'" name="error">
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
import InTableSkeleton from "./InTableSkeleton.vue";
import InTableTreeCell from "./InTableTreeCell.vue";
import { resolveSkeletonRowCount } from "./resolveSkeletonRowCount";
import {
  asCheckboxMode,
  isTreeCheckboxEnabled,
  resolveRowCheckboxMode,
} from "./checkboxMode";
import { collectTreeLevels, flattenTreeRows, treeRowHasChildren } from "./tableTree";
import { useAppStateStore } from "@/stores/modules/app";
import { ElTable, type TableInstance } from "element-plus";
import "element-plus/theme-chalk/el-table.css";
import "element-plus/theme-chalk/el-checkbox.css";
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
  "selection-change": [rows: TableRow[]];
  "update:expandRowKeys": [keys: Array<string>];
  /** @deprecated InTable 不再内置刷新入口，待 rollout 清理页面监听后删除。 */
  refresh: [];
}>();
const { componentSize } = storeToRefs(useAppStateStore());

const hasRows = computed(() => (props.data?.length ?? 0) > 0);
const showSkeleton = computed(() => Boolean(props.loading) && !hasRows.value);
const showOverlayLoading = computed(() => Boolean(props.loading) && hasRows.value);
const skeletonRows = computed(() => resolveSkeletonRowCount(props.page.size));

const hasMeta = computed(() => Boolean(slot.title || slot.subtitle || slot.summary));
const hasTools = computed(() =>
  Boolean(slot["tools-start"] || slot["tools-end"] || slot.toolbar),
);

const asRecord = (row: TableRow): Record<string, unknown> => row as Record<string, unknown>;

const childrenKey = computed(() => props.treeProps?.children ?? "children");
const hasChildrenKey = computed(() => props.treeProps?.hasChildren ?? "hasChildren");

const resolveRowKey = (row: TableRow): string => {
  const key = props.rowKey;
  if (typeof key === "function") {
    const value = key(row);
    return value == null ? "" : String(value);
  }
  const field = key || "id";
  const value = asRecord(row)[field];
  return value == null ? "" : String(value);
};

const useCustomTree = computed(() => Boolean(props.customTree || props.treeColumn));
const usesTreeCheckbox = computed(
  () => Boolean(props.treeColumn) && isTreeCheckboxEnabled(props.checkbox),
);

const nativeHeaderCheckboxMode = computed(() => {
  const column = (props.headers ?? []).find((item) => item.type === "selection");
  if (!column) {
    return "off" as const;
  }
  return asCheckboxMode(column.headerCheckbox, "off");
});

const hideHeaderSelection = computed(() => {
  const hasSelection = (props.headers ?? []).some((item) => item.type === "selection");
  return hasSelection && nativeHeaderCheckboxMode.value === "off";
});
const headerSelectionDisabled = computed(() => nativeHeaderCheckboxMode.value === "disabled");

const treeHeaderCheckboxMode = computed(() => {
  if (!usesTreeCheckbox.value) {
    return "off" as const;
  }
  return asCheckboxMode(props.headerCheckbox, "on");
});

const innerExpandKeys = ref<Array<string>>([...(props.expandRowKeys ?? [])]);
watch(
  () => props.expandRowKeys,
  (keys) => {
    if (keys) {
      innerExpandKeys.value = [...keys];
    }
  },
);

const selectedRows = ref<TableRow[]>([]);

const treeRows = computed(() =>
  flattenTreeRows((props.data ?? []) as Array<Record<string, unknown>>, childrenKey.value),
);

const treeLevels = computed(() =>
  collectTreeLevels((props.data ?? []) as Array<Record<string, unknown>>, {
    childrenKey: childrenKey.value,
    rowKey: (row) => resolveRowKey(row as TableRow),
  }),
);

const selectableTreeRows = computed(() =>
  treeRows.value.filter(
    (row) => resolveRowCheckboxMode(props.checkbox, row as TableRow) === "on",
  ) as TableRow[],
);

const selectedIds = computed(
  () => new Set(selectedRows.value.map((row) => resolveRowKey(row)).filter(Boolean)),
);

const headerChecked = computed(
  () =>
    selectableTreeRows.value.length > 0 &&
    selectableTreeRows.value.every((row) => selectedIds.value.has(resolveRowKey(row))),
);

const headerIndeterminate = computed(() => {
  const selected = selectableTreeRows.value.filter((row) =>
    selectedIds.value.has(resolveRowKey(row)),
  ).length;
  return selected > 0 && selected < selectableTreeRows.value.length;
});

const isTreeColumn = (item: TableHeaderRecord): boolean =>
  Boolean(props.treeColumn) && String(item.prop) === props.treeColumn;

const showColumnHeader = (item: TableHeaderRecord): boolean => {
  if (isTreeColumn(item)) {
    return true;
  }
  return Boolean((!item.type || item.type === "default") && slot[`${String(item.prop)}-header`]);
};

const rowCheckboxMode = (row: TableRow) =>
  usesTreeCheckbox.value ? resolveRowCheckboxMode(props.checkbox, row) : "off";

const isRowSelected = (row: TableRow): boolean => selectedIds.value.has(resolveRowKey(row));

const isRowExpanded = (row: TableRow): boolean => innerExpandKeys.value.includes(resolveRowKey(row));

const canExpandRow = (row: TableRow): boolean => {
  if (props.treeExpand === false) {
    return false;
  }
  if (typeof props.treeExpand === "function" && !props.treeExpand(row)) {
    return false;
  }
  return treeRowHasChildren(asRecord(row), childrenKey.value, hasChildrenKey.value);
};

const treeIndentOf = (row: TableRow): string => {
  const id = resolveRowKey(row);
  const level = (id && treeLevels.value.get(id)) || 0;
  return `calc(${level} * var(--in-space-4))`;
};

const emitTreeSelection = (rows: TableRow[]): void => {
  selectedRows.value = rows;
  emits("selection-change", rows);
};

watch(selectableTreeRows, (rows) => {
  if (!usesTreeCheckbox.value) {
    return;
  }
  const ids = new Set(rows.map((row) => resolveRowKey(row)).filter(Boolean));
  const next = selectedRows.value.filter((row) => ids.has(resolveRowKey(row)));
  if (next.length !== selectedRows.value.length) {
    emitTreeSelection(next);
  }
});

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
    customTree: _customTree,
    treeColumn: _treeColumn,
    checkbox: _checkbox,
    headerCheckbox: _headerCheckbox,
    treeExpand: _treeExpand,
    expandRowKeys: _expandRowKeys,
    ...rest
  } = props;
  return {
    ...rest,
    expandRowKeys: innerExpandKeys.value,
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

const privateOnElSelectionChange = (rows: TableRow[]): void => {
  if (usesTreeCheckbox.value) {
    return;
  }
  emits("selection-change", rows);
};

const privateOnToggleExpand = (row: TableRow): void => {
  const id = resolveRowKey(row);
  if (!id) {
    return;
  }
  const next = new Set(innerExpandKeys.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  const keys = [...next];
  innerExpandKeys.value = keys;
  emits("update:expandRowKeys", keys);
};

const privateOnToggleSelect = (row: TableRow, checked: boolean): void => {
  if (rowCheckboxMode(row) !== "on") {
    return;
  }
  const id = resolveRowKey(row);
  if (!id) {
    return;
  }
  if (checked) {
    if (!selectedIds.value.has(id)) {
      emitTreeSelection([...selectedRows.value, row]);
    }
    return;
  }
  emitTreeSelection(selectedRows.value.filter((item) => resolveRowKey(item) !== id));
};

const privateOnHeaderCheck = (checked: boolean | string | number): void => {
  if (treeHeaderCheckboxMode.value === "disabled") {
    return;
  }
  emitTreeSelection(checked === true ? [...selectableTreeRows.value] : []);
};

const tableInstance = shallowRef<TableInstance>();
const tableRef = (instance: Element | ComponentPublicInstance | null) => {
  tableInstance.value =
    instance && "clearSelection" in instance && "toggleRowSelection" in instance
      ? (instance as TableInstance)
      : undefined;
};

defineExpose<TableAPI<TableRow>>({
  clearSelection: () => {
    if (usesTreeCheckbox.value) {
      emitTreeSelection([]);
      return;
    }
    tableInstance.value?.clearSelection();
  },
  toggleRowSelection: (row, selected) => {
    if (usesTreeCheckbox.value) {
      privateOnToggleSelect(row, selected ?? !isRowSelected(row));
      return;
    }
    tableInstance.value?.toggleRowSelection(row, selected);
  },
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

:deep(.el-table__empty-block:has(.in-table-skeleton)) {
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  min-height: 100%;
  padding: 0;
}

:deep(.el-table__empty-block:has(.in-table-skeleton) .el-table__empty-text) {
  width: 100%;
  line-height: 0;
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
  font-weight: var(--in-font-weight-body);
  font-size: var(--in-font-size-body);
  color: var(--in-table-header-text);
  background: var(--in-table-header-bg);
}

:deep(th.el-table__cell > .cell) {
  font-weight: inherit;
  font-size: inherit;
  color: inherit;
}

:deep(td.el-table__cell) {
  height: var(--in-table-row-height);
  padding: 0 12px;
  border-bottom-color: var(--in-border-color);
  color: var(--in-table-cell-text);
  font-size: var(--in-font-size-body);
}

:deep(.el-table .cell:has(.in-status-tag)),
:deep(.el-table .cell:has(.in-table-actions)) {
  overflow: visible;
}

:deep(th.el-table__cell.is-leaf) {
  border-bottom: none;
}

:deep(.el-table .cell:has(> .el-table__expand-icon)),
:deep(.el-table .cell:has(> .el-table__placeholder)),
:deep(.el-table .cell:has(> .el-table__indent)) {
  display: flex;
  align-items: center;
  min-width: 0;
}

:deep(.el-table__indent) {
  flex: none;
}

:deep(.el-table__expand-icon),
:deep(.el-table__placeholder) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--in-gray-900);
  font-size: 0;
  line-height: 0;
  transform: none !important;
}

:deep(.el-table__expand-icon .el-icon) {
  display: none;
}

:deep(.el-table__expand-icon::before) {
  content: "";
  display: block;
  width: 5px;
  height: 8px;
  background: url("../../assets/table-expand-collapsed.svg") center / contain no-repeat;
}

:deep(.el-table__expand-icon--expanded::before) {
  width: 8px;
  height: 5px;
  background-image: url("../../assets/table-expand-expanded.svg");
}

:deep(.el-checkbox) {
  --el-checkbox-input-width: var(--in-checkbox-size);
  --el-checkbox-input-height: var(--in-checkbox-size);
  --el-checkbox-height: var(--in-checkbox-size);
  --el-checkbox-border-radius: var(--in-checkbox-radius);
  height: var(--in-checkbox-size);
  margin-inline-end: 0;
}

:deep(.el-checkbox__input) {
  height: var(--in-checkbox-size);
  align-items: center;
}

:deep(.el-checkbox__inner) {
  box-sizing: border-box;
  width: var(--in-checkbox-size);
  height: var(--in-checkbox-size);
  border-radius: var(--in-checkbox-radius);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 12px 12px;
  transition:
    background-color var(--in-motion-duration) var(--in-motion-ease-tabs-ink),
    border-color var(--in-motion-duration) var(--in-motion-ease-tabs-ink);
}

:deep(.el-checkbox__inner::after) {
  display: none;
  transition: none;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-image: url("../../assets/table-checkbox-checked.svg");
}

:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner::before) {
  top: 50%;
  left: 50%;
  right: auto;
  width: 8px;
  height: 2px;
  border-radius: 1px;
  transform: translate(-50%, -50%);
}

.in-table.is-hide-header-selection :deep(th.el-table-column--selection .el-checkbox) {
  display: none;
}

.in-table.is-header-selection-disabled :deep(th.el-table-column--selection .el-checkbox) {
  pointer-events: none;
  cursor: not-allowed;
}

.in-table.is-header-selection-disabled :deep(th.el-table-column--selection .el-checkbox__inner) {
  opacity: 0.5;
}

.in-table.is-custom-tree :deep(.el-table__indent),
.in-table.is-custom-tree :deep(.el-table__placeholder),
.in-table.is-custom-tree :deep(.el-table__expand-icon) {
  display: none;
}

:deep(.in-table-tree-cell) {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--in-space-2);
  line-height: 1;
}

:deep(.in-table-tree-expand),
:deep(.in-table-tree-expand-spacer) {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--in-checkbox-size);
  height: var(--in-checkbox-size);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--in-gray-900);
}

:deep(.in-table-tree-expand) {
  cursor: pointer;
}

:deep(.in-table-tree-expand)::before,
:deep(.in-table-tree-expand-spacer)::before {
  content: "";
  display: block;
  width: 5px;
  height: 8px;
  background: url("../../assets/table-expand-collapsed.svg") center / contain no-repeat;
}

:deep(.in-table-tree-expand-spacer)::before {
  visibility: hidden;
}

:deep(.in-table-tree-expand.is-expanded)::before {
  width: 8px;
  height: 5px;
  background-image: url("../../assets/table-expand-expanded.svg");
}

:deep(.in-table-tree-content) {
  min-width: 0;
  flex: 1;
}

.title {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: var(--in-space-3);
  color: var(--in-text-color);
  font-weight: var(--in-font-weight-section-title);
  font-size: var(--in-font-size-section-title);
  line-height: var(--in-line-height-section-title);
}

.title :slotted(.in-table__count) {
  flex: none;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  white-space: nowrap;
}

.subtitle {
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}
</style>
