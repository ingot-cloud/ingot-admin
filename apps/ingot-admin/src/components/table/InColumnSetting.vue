<template>
  <el-icon>
    <i-ep:setting ref="settingButtonRef" v-click-outside="privateOnSettingClickOutside" />
    <el-popover
      ref="settingPopoverRef"
      trigger="click"
      placement="bottom"
      width="300"
      :virtual-ref="settingButtonRef"
      virtual-triggering
    >
      <div flex flex-col items-center>
        <el-table
          ref="settingTable"
          :data="data"
          height="300"
          @selection-change="privateOnTableSelectionChange"
        >
          <el-table-column type="selection" width="55" :selection="true" />
          <el-table-column label="列名">
            <template #default="scope">{{ scope.row.label }}</template>
          </el-table-column>
          <el-table-column :align="'right'" prop="actions">
            <template #header>
              <in-button @click="privateOnResetClick"> 重置 </in-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-popover>
  </el-icon>
</template>
<script lang="ts" setup>
import type { PropType } from "vue";
import type { TableHeaderRecord } from "./types";
import type { ElTable } from "element-plus";
import { ClickOutside as vClickOutside } from "element-plus";

const props = defineProps({
  data: {
    type: Object as PropType<Array<TableHeaderRecord>>,
    default() {
      return [];
    },
  },
});
const emits = defineEmits(["onSelectionChange"]);

const settingTable = ref<InstanceType<typeof ElTable>>();
const settingPopoverRef = ref();
const settingButtonRef = ref();

const inited = ref(false);
const initShowPropList: Array<string> = [];
nextTick(() => {
  props.data.forEach((row) => {
    settingTable.value?.toggleRowSelection(row, !row.hide);
    if (!row.hide) {
      initShowPropList.push(row.prop as string);
    }
  });
  inited.value = true;
});

const privateOnTableSelectionChange = (selectArray: Array<TableHeaderRecord>) => {
  if (!inited.value) {
    return;
  }
  emits(
    "onSelectionChange",
    selectArray.map((item) => item.prop),
  );
};
const privateOnResetClick = () => {
  props.data.forEach((item) => {
    settingTable.value?.toggleRowSelection(item, initShowPropList.includes(item.prop as string));
  });
};
const privateOnSettingClickOutside = () => {
  unref(settingPopoverRef).popperRef?.delayHide?.();
};
</script>
