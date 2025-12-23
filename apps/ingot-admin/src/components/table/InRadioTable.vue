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
            size="22"
            :data="props.headers"
            @onSelectionChange="privateOnHeaderChanged"
          />
        </el-tooltip>
      </div>
    </div>
  </div>

  <el-radio-group v-model="radioValue" w-full>
    <component
      :is="h(ElTable, { ...$attrs, ...props, ref: tableRef })"
      v-loading="loading"
      @rowClick="privateRowClick"
    >
      <el-table-column v-for="item in headersEnable" :key="item.prop" v-bind="item">
        <template v-if="item.type === 'expand'" #default="props">
          <slot :name="item.prop" :item="props.row" :index="props.$index"> </slot>
        </template>
        <template v-slot="scope" v-if="!item.type || item.type === 'default'">
          <slot :name="item.prop" :item="scope.row" :index="scope.$index">
            {{
              item.transform
                ? item.transform(scope.row[String(item.prop)])
                : scope.row[String(item.prop)]
            }}
          </slot>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty />
      </template>
    </component>
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
import type { TableHeaderRecord } from "./types";
import { type InTableProps, DefaultProps } from "./props";
import { useAppStateStore } from "@/stores/modules/app";
import { ElTable } from "element-plus";
import type { ComponentInstance } from "vue";

defineOptions({
  name: "InRadioTable",
  inheritAttrs: false,
});

const slot = useSlots();
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

const privateRowClick = (item: any) => {
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
const privateOnHeaderChanged = (value: Array<String>) => {
  headersEnable.value = props.headers.filter((item: TableHeaderRecord) =>
    value.includes(item.prop as string),
  );
};
const privateOnRefreshClick = () => {
  emits("refresh");
};

// 传递table所有方法
const vm = getCurrentInstance();
const tableRef = (instance: any) => {
  vm!.exposed = instance;
  vm!.exposeProxy = instance;
};

defineExpose({} as ComponentInstance<typeof ElTable>);
</script>
<style lang="postcss" scoped>
:deep(th.el-table__cell) {
  --el-table-header-bg-color: #f8f8f8;
  color: black;
  padding: 10px 0;
}
:deep(th.el-table__cell.is-leaf) {
  border-bottom: none;
}
.title {
  color: #171a1d;
  font-weight: 600;
  font-size: 17px;
}
</style>
