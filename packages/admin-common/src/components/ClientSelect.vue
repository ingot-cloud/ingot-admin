<template>
  <in-page-select
    :load-data="loadClientOptions"
    :page-size="20"
    :value-field="props.valueField"
    :label-field="labelField"
    :default-select-index="props.defaultSelectIndex"
  />
</template>

<script setup lang="ts">
import { loadClientOptions } from "../api/client";

const props = withDefaults(
  defineProps<{
    valueField?: string;
    defaultSelectIndex?: number;
  }>(),
  {
    valueField: "id",
    defaultSelectIndex: 0,
  },
);

const labelField = "clientName";
</script>
