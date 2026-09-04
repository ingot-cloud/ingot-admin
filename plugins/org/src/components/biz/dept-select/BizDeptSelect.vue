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
import { TreeKeyAndProps } from "@/models";
import { useQuery } from "@tanstack/vue-query";
import { OrgDeptTreeQueryOptions } from "@/api/org/dept.query";

const deptQuery = useQuery(() => OrgDeptTreeQueryOptions());
const deptTree = computed(() => deptQuery.data.value ?? []);

defineExpose({
  fetchData() {
    void deptQuery.refetch();
  },
});
</script>
