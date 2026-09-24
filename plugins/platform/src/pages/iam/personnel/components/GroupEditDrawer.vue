<template>
  <group-wizard ref="inner" @success="emits('success')" />
</template>

<script setup lang="ts">
import type { GroupRow } from "../groupTable";
import GroupWizard from "./GroupWizard.vue";

defineOptions({ name: "GroupEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const inner = ref<{ show: (row?: GroupRow) => void }>();

defineExpose({
  show(row?: GroupRow) {
    inner.value?.show(row);
  },
});
</script>
