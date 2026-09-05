<template>
  <div
    flex
    flex-col
    gap-10px
    :class="{
      'm-b-10px': !hideSetting || slot.title || slot.toolbar || slot.subtitle,
    }"
  >
    <div v-if="slot.title" class="title">
      <slot name="title"> </slot>
    </div>
    <div flex flex-row justify-between items-center>
      <div flex justify-center items-center gap-1>
        <slot name="toolbar"></slot>
      </div>

      <div flex justify-center items-center gap-1 v-if="!hideSetting">
        <el-divider direction="vertical" />

        <el-tooltip content="刷新" effect="light" placement="top">
          <in-refresh-icon size="22" @refresh="privateOnRefreshClick" />
        </el-tooltip>
        <el-tooltip content="设置" effect="light" placement="top">
          <in-column-setting
            :data="props.headers"
            :table-id="props.tableId"
            @onSelectionChange="privateOnHeaderChanged"
          />
        </el-tooltip>
      </div>
    </div>
  </div>

  <el-radio-group v-model="radioValue" w-full>
    <el-table
      v-bind="{ ...$attrs, ...props }"
      :ref="tableRef"
      v-loading="loading"
      @row-click="privateRowClick"
    >
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
        <el-empty :image="emptyIllustration" description="暂无数据" />
      </template>
    </el-table>
  </el-radio-group>

  <div v-if="page && page.total" m-t-20px flex flex-row justify-end items-start>
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
</template>
<script lang="ts" setup>
import type { InTableSlots, TableAPI, TableHeaderRecord } from "./types";
import { type InTableProps, DefaultProps } from "./props";
import { emptyIllustration } from "./emptyIllustration";
import { useAppStateStore } from "@/stores/modules/app";
import { ElTable, type TableInstance } from "element-plus";
import "element-plus/theme-chalk/el-table.css";
import type { ComponentPublicInstance } from "vue";

defineOptions({
  name: "InRadioTable",
  inheritAttrs: false,
});

type TableRow = NonNullable<InTableProps["data"]>[number];

const slot = defineSlots<InTableSlots<TableRow>>();
const props = withDefaults(defineProps<InTableProps>(), DefaultProps);
const emits = defineEmits(["handleSizeChange", "handleCurrentChange", "refresh"]);
const { componentSize } = storeToRefs(useAppStateStore());

const headersEnable = ref<Array<TableHeaderRecord>>(
  props.headers.filter((item: TableHeaderRecord) => !item.hide),
);

const current = ref(props.page.current);
const size = ref(props.page.size);
const total = ref(props.page.total);

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

const radioValue = ref();

const privateRowClick = (item: TableRow) => {
  if (props.radioKey) {
    radioValue.value = item[props.radioKey];
  }
};

const privateHandleSizeChange = (val: number) => {
  emits("handleSizeChange", { value: val, type: "size" });
};

const privateHandleCurrentChange = (val: number) => {
  emits("handleCurrentChange", { value: val, type: "current" });
};
const privateOnHeaderChanged = (value: string[]) => {
  headersEnable.value = props.headers.filter((item: TableHeaderRecord) =>
    value.includes(item.prop as string),
  );
};
const privateOnRefreshClick = () => {
  emits("refresh");
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
  toggleRowSelection: (row, selected) =>
    tableInstance.value?.toggleRowSelection(row, selected),
});
</script>
<style lang="postcss" scoped>
:deep(th.el-table__cell) {
  height: var(--in-table-header-height);
  padding: 0 12px;
  color: var(--in-text-color-secondary);
  background: var(--in-table-header-bg);
}
:deep(td.el-table__cell) {
  height: var(--in-table-row-height);
  padding: 0 12px;
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
</style>
