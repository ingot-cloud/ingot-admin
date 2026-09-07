<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="浏览当前组织的部门架构。" />
    </template>

    <in-split-layout>
      <DeptTreeView />
    </in-split-layout>
  </in-page-frame>
</template>
<script setup lang="ts">
import DeptTreeView from "./DeptTreeView.vue";
</script>
