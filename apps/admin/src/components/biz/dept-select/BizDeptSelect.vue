<template>
  <el-tree-select
    :data="deptTree"
    :node-key="TreeKeyAndProps.nodeKey"
    :value-key="TreeKeyAndProps.nodeKey"
    :props="TreeKeyAndProps.props"
    :check-strictly="true"
  />
</template>
<script setup lang="ts">
import { TreeKeyAndProps } from "@base/models";
import { useDeptStore } from "@base/stores/modules/org/dept";

const deptStore = useDeptStore();
const { deptTree } = storeToRefs(deptStore);

onMounted(() => {
  deptStore.fetchDeptTree();
});

defineExpose({
  fetchData() {
    deptStore.fetchDeptTree();
  },
});
</script>
