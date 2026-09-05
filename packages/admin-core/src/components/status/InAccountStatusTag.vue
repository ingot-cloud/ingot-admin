<template>
  <status-tag v-if="tone" :tone="tone" :label="label" />
</template>
<script lang="ts" setup>
import StatusTag from "./StatusTag.vue";

defineOptions({
  name: "InAccountStatusTag",
});

const props = withDefaults(
  defineProps<{
    enabled?: boolean;
    locked?: boolean;
  }>(),
  {
    enabled: true,
    locked: false,
  },
);

const tone = computed<"info" | "warning" | "danger">(() => {
  if (props.enabled && !props.locked) {
    return "info";
  }
  if (!props.enabled) {
    return "warning";
  }
  return "danger";
});

const label = computed(() => {
  if (tone.value === "info") {
    return "正常";
  }
  if (tone.value === "warning") {
    return "已暂停";
  }
  return "已锁定";
});
</script>
