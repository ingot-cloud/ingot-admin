<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header />
    </template>

    <in-split-layout>
      <DeptTreeView />
    </in-split-layout>
  </in-page-frame>
</template>
<script setup lang="ts">
import DeptTreeView from "./DeptTreeView.vue";
</script>
