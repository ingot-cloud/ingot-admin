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
import { ClientPageAPI } from "@/api/platform/dev/client";

const valueField = "id";
const labelField = "clientName";
const loadData = async (params: LoadDataParams) => {
  const page = {
    current: params.current,
    size: params.size,
  };
  const condition = {
    clientName: params.query,
  };
  const result = await ClientPageAPI(page, condition);
  return result.data;
};
</script>
