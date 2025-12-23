<template>
  <in-page-select
    :load-data="loadData"
    :page-size="20"
    :value-field="valueField"
    :label-field="labelField"
    :default-select-index="0"
  />
</template>

<script setup lang="ts">
import type { LoadDataParams } from "@/components/select/InPageSelect.vue";
import { TenantPageAPI } from "@/api/platform/org/tenant";

const valueField = "id";
const labelField = "name";
const loadData = async (params: LoadDataParams) => {
  const page = {
    current: params.current,
    size: params.size,
  };
  const condition = {
    name: params.query,
  };
  const result = await TenantPageAPI(page, condition);
  return result.data;
};
</script>
