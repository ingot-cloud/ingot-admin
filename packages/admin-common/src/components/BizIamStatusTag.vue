<template>
  <in-tag v-if="tag" :value="tag" />
</template>

<script setup lang="ts">
import { ConfigurationStatus, useConfigurationStatusEnum } from "../models/iam";

defineOptions({ name: "BizIamStatusTag" });

const props = defineProps<{
  status?: ConfigurationStatus | string | null;
}>();

const statusEnum = useConfigurationStatusEnum();
const tag = computed(() =>
  props.status ? statusEnum.getTagText(props.status as ConfigurationStatus) : undefined,
);
</script>
