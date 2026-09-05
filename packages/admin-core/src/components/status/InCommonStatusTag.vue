<template>
  <status-tag v-if="tone && label" :tone="tone" :label="label" />
</template>
<script lang="ts" setup>
import { CommonStatus } from "@/models/enums";
import { resolveCommonStatus } from "./resolveCommonStatus";
import StatusTag from "./StatusTag.vue";

defineOptions({
  name: "InCommonStatusTag",
});

const props = defineProps<{
  status?: CommonStatus | string | number | null;
}>();

const resolvedStatus = computed(() => resolveCommonStatus(props.status));

const tone = computed<"info" | "warning" | undefined>(() => {
  if (resolvedStatus.value === CommonStatus.Enable) {
    return "info";
  }
  if (resolvedStatus.value === CommonStatus.Lock) {
    return "warning";
  }
  return undefined;
});

const label = computed(() => {
  if (resolvedStatus.value === CommonStatus.Enable) {
    return "正常";
  }
  if (resolvedStatus.value === CommonStatus.Lock) {
    return "已暂停";
  }
  return "";
});
</script>
