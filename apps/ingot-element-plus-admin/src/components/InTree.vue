<template>
  <el-tree
    class="in-tree"
    :highlight-current="true"
    :expand-on-click-node="false"
    ref="innerElTreeRef"
  >
    <template #default="{ node, data }" v-if="slot.default">
      <slot :node="node" :data="data"> </slot>
    </template>
  </el-tree>
</template>
<script setup lang="ts">
const slot = useSlots();

const innerElTreeRef = ref();

defineExpose({
  filter: (...args: any) => {
    return innerElTreeRef.value.filter(...args);
  },
  updateKeyChildren: (...args: any) => {
    return innerElTreeRef.value.updateKeyChildren(...args);
  },
  getCheckedNodes: (...args: any) => {
    return innerElTreeRef.value.getCheckedNodes(...args);
  },
  setCheckedNodes: (...args: any) => {
    return innerElTreeRef.value.setCheckedNodes(...args);
  },
  getCheckedKeys: (...args: any) => {
    return innerElTreeRef.value.getCheckedKeys(...args);
  },
  setCheckedKeys: (...args: any) => {
    return innerElTreeRef.value.setCheckedKeys(...args);
  },
  setChecked: (...args: any) => {
    return innerElTreeRef.value.setChecked(...args);
  },
  getHalfCheckedNodes: (...args: any) => {
    return innerElTreeRef.value.getHalfCheckedNodes(...args);
  },
  getHalfCheckedKeys: (...args: any) => {
    return innerElTreeRef.value.getHalfCheckedKeys(...args);
  },
  getCurrentKey: (...args: any) => {
    return innerElTreeRef.value.getCurrentKey(...args);
  },
  getCurrentNode: (...args: any) => {
    return innerElTreeRef.value.getCurrentNode(...args);
  },
  setCurrentKey: (...args: any) => {
    return innerElTreeRef.value.setCurrentKey(...args);
  },
  setCurrentNode: (...args: any) => {
    return innerElTreeRef.value.setCurrentNode(...args);
  },
  getNode: (...args: any) => {
    return innerElTreeRef.value.getNode(...args);
  },
  remove: (...args: any) => {
    return innerElTreeRef.value.remove(...args);
  },
  append: (...args: any) => {
    return innerElTreeRef.value.append(...args);
  },
  insertBefore: (...args: any) => {
    return innerElTreeRef.value.insertBefore(...args);
  },
  insertAfter: (...args: any) => {
    return innerElTreeRef.value.insertAfter(...args);
  },
});
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
