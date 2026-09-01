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

const slot = useSlots();

const vm = getCurrentInstance();
const changeRef = (instance: any) => {
  vm!.exposed = instance;
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
</style>
