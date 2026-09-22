<template>
  <in-page-select
    :load-data="loadTenantOptions"
    :page-size="20"
    :value-field="valueField"
    :label-field="labelField"
    :placeholder="placeholder"
    :default-select-index="0"
  />
</template>

<script setup lang="ts">
import { loadTenantOptions } from "../api/tenant.query";

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: "请选择组织",
  },
);

const valueField = "id";
const labelField = "name";
</script>
