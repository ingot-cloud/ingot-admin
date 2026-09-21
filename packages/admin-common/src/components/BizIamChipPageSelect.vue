<template>
  <div class="flex flex-col gap-8px">
    <div class="flex flex-wrap gap-8px">
      <el-tag v-for="id in model" :key="id" closable @close="privateRemove(id)">
        {{ labels[id] ?? id }}
      </el-tag>
      <span v-if="!model.length" class="text-[var(--el-text-color-secondary)]">{{ emptyText }}</span>
    </div>
    <in-page-select
      v-model="pick"
      filterable
      remote
      clearable
      :value-field="valueField"
      :label-field="labelField"
      :placeholder="placeholder"
      :page-size="pageSize"
      :load-data="wrappedLoad"
      @change="privateAdd"
    />
  </div>
</template>

<script setup lang="ts">
import type { LoadDataParams, Page } from "@ingot/admin-core";
import { IAM_DEFAULT_PAGE_SIZE, type IamSelectOption } from "../models/iam";

defineOptions({ name: "BizIamChipPageSelect" });

const props = withDefaults(
  defineProps<{
    loadData: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    placeholder?: string;
    emptyText?: string;
    valueField?: string;
    labelField?: string;
    pageSize?: number;
    initialLabels?: Record<string, string>;
  }>(),
  {
    placeholder: "远程分页添加",
    emptyText: "未选择",
    valueField: "id",
    labelField: "name",
    pageSize: IAM_DEFAULT_PAGE_SIZE,
  },
);

const model = defineModel<string[]>({ default: () => [] });
const pick = ref("");
const labels = reactive<Record<string, string>>({});

watch(
  () => props.initialLabels,
  (value) => {
    Object.assign(labels, value ?? {});
  },
  { immediate: true, deep: true },
);

const wrappedLoad = async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  const page = await props.loadData(params);
  for (const item of page.records ?? []) {
    labels[item.id] = item.name;
  }
  return page;
};

const privateAdd = (value: string): void => {
  if (value && !model.value.includes(value)) {
    model.value = [...model.value, value];
  }
  pick.value = "";
};

const privateRemove = (id: string): void => {
  model.value = model.value.filter((item) => item !== id);
};
</script>
