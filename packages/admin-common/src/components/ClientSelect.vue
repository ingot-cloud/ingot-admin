<template>
  <in-page-select
    :load-data="loadClientOptions"
    :page-size="20"
    :value-field="props.valueField"
    :label-field="labelField"
    :placeholder="placeholder"
    :default-select-index="props.defaultSelectIndex"
  />
</template>

<script setup lang="ts">
import { loadClientOptions } from "../api/client.query";

const props = withDefaults(
  defineProps<{
    valueField?: string;
    defaultSelectIndex?: number;
    placeholder?: string;
  }>(),
  {
    valueField: "id",
    defaultSelectIndex: 0,
    placeholder: "请选择客户端",
  },
);

const labelField = "clientName";
</script>
