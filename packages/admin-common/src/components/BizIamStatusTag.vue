<template>
  <status-tag v-if="tone && label" :tone="tone" :label="label" />
</template>

<script lang="ts" setup>
import { StatusTag } from "@ingot/admin-core";
import { ConfigurationStatus } from "../models/iam";

defineOptions({ name: "BizIamStatusTag" });

const props = defineProps<{
  status?: ConfigurationStatus | string | null;
}>();

const resolved = computed(() => {
  if (props.status === ConfigurationStatus.ENABLED) {
    return ConfigurationStatus.ENABLED;
  }
  if (props.status === ConfigurationStatus.DISABLED) {
    return ConfigurationStatus.DISABLED;
  }
  return undefined;
});

const tone = computed<"info" | "warning" | undefined>(() => {
  if (resolved.value === ConfigurationStatus.ENABLED) {
    return "info";
  }
  if (resolved.value === ConfigurationStatus.DISABLED) {
    return "warning";
  }
  return undefined;
});

const label = computed(() => {
  if (resolved.value === ConfigurationStatus.ENABLED) {
    return "启用";
  }
  if (resolved.value === ConfigurationStatus.DISABLED) {
    return "停用";
  }
  return "";
});
</script>
