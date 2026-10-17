<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="部门。维护组织架构；非空删除由服务端返回限制。" />
    </template>
    <in-split-layout>
      <DeptTab />
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import DeptTab from "../members/components/DeptTab.vue";
</script>
