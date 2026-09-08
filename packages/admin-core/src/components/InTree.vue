<template>
  <el-tree class="in-tree" :highlight-current="true" :expand-on-click-node="false" :ref="changeRef">
    <template #default="{ node, data }" v-if="slot.default">
      <slot :node="node" :data="data"> </slot>
    </template>
  </el-tree>
</template>
<script setup lang="ts">
import type { ElTree } from "element-plus";
import type { ComponentInstance } from "vue";
import "element-plus/theme-chalk/el-tree.css";

const slot = useSlots();

const vm = getCurrentInstance();
const changeRef = (instance: ComponentInstance<typeof ElTree> | null): void => {
  if (!vm) {
    return;
  }
  vm.exposed = instance ?? {};
};

defineExpose({} as ComponentInstance<typeof ElTree>);
</script>
<style scoped lang="postcss">
.in-tree {
  --el-tree-node-hover-bg-color: rgba(126, 134, 142, 0.16);
  --el-tree-node-content-height: 36px;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-tree-node-hover-bg-color) !important;
  border-radius: 4px;
}
:deep(.el-tree-node__content:hover) {
  border-radius: 4px;
}

:deep(.el-tree-node__content) {
  align-items: center;
}

:deep(.el-tree-node__expand-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: var(--in-checkbox-size);
  height: var(--in-checkbox-size);
  padding: 0;
  box-sizing: border-box;
  color: var(--in-gray-900);
  font-size: 0;
  line-height: 0;
  transform: none !important;
}

:deep(.el-tree-node__expand-icon .el-icon),
:deep(.el-tree-node__expand-icon svg) {
  display: none;
}

:deep(.el-tree-node__expand-icon::before) {
  content: "";
  display: block;
  width: 5px;
  height: 8px;
  background: url("../assets/table-expand-collapsed.svg") center / contain no-repeat;
}

:deep(.el-tree-node__expand-icon.expanded::before) {
  width: 8px;
  height: 5px;
  background-image: url("../assets/table-expand-expanded.svg");
}

:deep(.el-tree-node__expand-icon.is-leaf::before) {
  visibility: hidden;
}
</style>
