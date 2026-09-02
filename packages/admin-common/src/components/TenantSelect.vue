<template>
  <in-page-select
    :load-data="loadTenantOptions"
    :page-size="20"
    :value-field="valueField"
    :label-field="labelField"
    :default-select-index="0"
  />
</template>

<script setup lang="ts">
import { loadTenantOptions } from "../api/tenant";

const valueField = "id";
const labelField = "name";
</script>
