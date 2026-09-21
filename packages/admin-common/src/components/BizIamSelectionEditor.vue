<template>
  <div class="flex flex-col gap-12px">
    <div>
      <div class="mb-8px">成员</div>
      <biz-iam-chip-page-select
        v-model="model.members"
        :load-data="loadMembers"
        placeholder="远程分页添加成员"
        empty-text="未选择成员"
      />
    </div>
    <div v-if="allowDepartments">
      <div class="mb-8px">部门</div>
      <div v-for="(item, index) in model.departments" :key="`${item.id}-${index}`" class="flex items-center gap-8px">
        <el-tag closable @close="privateRemoveDepartment(index)">
          {{ departmentLabels[item.id] ?? item.id }}
        </el-tag>
        <el-checkbox v-model="item.includeDescendants" @change="privateTouch">含下级</el-checkbox>
      </div>
      <in-page-select
        v-model="departmentPick"
        filterable
        remote
        clearable
        value-field="id"
        label-field="name"
        placeholder="远程分页添加部门"
        :page-size="IAM_DEFAULT_PAGE_SIZE"
        :load-data="wrappedDepartmentLoad"
        @change="privateAddDepartment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoadDataParams, Page } from "@ingot/admin-core";
import {
  IAM_DEFAULT_PAGE_SIZE,
  emptySelection,
  type IamSelectOption,
  type Selection,
} from "../models/iam";
import BizIamChipPageSelect from "./BizIamChipPageSelect.vue";

defineOptions({ name: "BizIamSelectionEditor" });

const props = withDefaults(
  defineProps<{
    loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    loadDepartments?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    allowDepartments?: boolean;
  }>(),
  {
    allowDepartments: true,
  },
);

const model = defineModel<Selection>({ default: emptySelection });
const departmentPick = ref("");
const departmentLabels = reactive<Record<string, string>>({});

const wrappedDepartmentLoad = async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  if (!props.loadDepartments) {
    return { current: 1, size: IAM_DEFAULT_PAGE_SIZE, total: 0, records: [] };
  }
  const page = await props.loadDepartments(params);
  for (const item of page.records ?? []) {
    departmentLabels[item.id] = item.name;
  }
  return page;
};

const privateTouch = (): void => {
  model.value = {
    members: [...model.value.members],
    departments: model.value.departments.map((item) => ({ ...item })),
  };
};

const privateAddDepartment = (value: string): void => {
  if (value && !model.value.departments.some((item) => item.id === value)) {
    model.value = {
      ...model.value,
      departments: [...model.value.departments, { id: value, includeDescendants: false }],
    };
  }
  departmentPick.value = "";
};

const privateRemoveDepartment = (index: number): void => {
  model.value = {
    ...model.value,
    departments: model.value.departments.filter((_, itemIndex) => itemIndex !== index),
  };
};
</script>
