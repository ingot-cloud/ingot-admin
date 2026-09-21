<template>
  <in-page-select
    v-model="model"
    :load-data="loadData"
    :page-size="pageSize"
    :value-field="valueField"
    :label-field="labelField"
    :placeholder="placeholder"
    :disabled="disabled"
    remote
    filterable
    clearable
  />
</template>

<script setup lang="ts">
import { IAM_DEFAULT_PAGE_SIZE, type SelectionPurpose } from "../models/iam";
import type { LoadDataParams, Page } from "@ingot/admin-core";

defineOptions({ name: "BizIamSubjectSelect" });

withDefaults(
  defineProps<{
    purpose: SelectionPurpose;
    loadData: (params: LoadDataParams) => Promise<Page<Record<string, unknown>>>;
    pageSize?: number;
    valueField?: string;
    labelField?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    pageSize: IAM_DEFAULT_PAGE_SIZE,
    valueField: "id",
    labelField: "name",
    placeholder: "选择对象",
    disabled: false,
  },
);

const model = defineModel<string | undefined>();
</script>
