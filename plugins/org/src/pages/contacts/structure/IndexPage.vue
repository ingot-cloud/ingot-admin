<template>
  <in-split-layout>
    <template #header>
      <ContactsTabs select-tab="组织架构" />
    </template>

    <DeptTreeView />
  </in-split-layout>
</template>
<script setup lang="ts">
import ContactsTabs from "@/pages/contacts/components/ContactsTabs.vue";
import DeptTreeView from "./DeptTreeView.vue";
</script>
<style scoped lang="postcss">
:deep(.in-split-layout__header) {
  padding: 0 !important;
}
</style>
