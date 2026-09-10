<template>
  <div>
    <InTag :value="{ text: '启用', tag: 'success' }" />
    <InTag :value="{ text: '锁定', tag: 'danger' }" />
  </div>
</template>

<script setup lang="ts">
import InTag from "../../../../packages/admin-core/src/components/tag/InTag.vue";
</script>
