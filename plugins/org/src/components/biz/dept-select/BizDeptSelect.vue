<template>
  <el-tree-select
    :placeholder="placeholder"
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

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: "请选择部门",
  },
);

const deptQuery = useQuery(() => OrgDeptTreeQueryOptions());
const deptTree = computed(() => deptQuery.data.value ?? []);

defineExpose({
  fetchData() {
    void deptQuery.refetch();
  },
});
</script>
