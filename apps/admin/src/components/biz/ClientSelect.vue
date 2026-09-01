<template>
  <in-page-select
    :load-data="loadData"
    :page-size="20"
    :value-field="props.valueField"
    :label-field="labelField"
    :default-select-index="props.defaultSelectIndex"
  />
</template>

<script setup lang="ts">
import type { LoadDataParams } from "@ingot/admin-core";
import { ClientPageAPI } from "@base/api/platform/dev/client";

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
