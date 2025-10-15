<template>
  <in-filter-container>
    <template #header>
      <ContactsTabs select-tab="组织架构" />
    </template>

    <DeptTreeView />
  </in-filter-container>
</template>
<script setup lang="ts">
import ContactsTabs from "@/pages/org/contacts/components/ContactsTabs.vue";
import DeptTreeView from "./DeptTreeView.vue";
</script>
<style scoped lang="postcss">
:deep(.in-filter-container-header) {
  padding: 0 !important;
}
</style>
