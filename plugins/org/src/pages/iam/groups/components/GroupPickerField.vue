<template>
  <in-selection-field
    :items="model"
    :show-avatar="false"
    closable
    placeholder="请选择用户组"
    @click="privateOpen"
    @remove="privateRemove($event.id)"
  />
  <biz-iam-member-picker-dialog
    ref="dialogRef"
    title="选择用户组"
    search-placeholder="请输入用户组名称"
    empty-text="暂无用户组"
    selected-unit="个用户组"
    :show-avatar="false"
    :load-members="privateLoad"
    @confirm="privateConfirm"
    @load-error="iamEditorFailure"
  />
</template>

<script setup lang="ts">
import {
  BizIamMemberPickerDialog,
  createIamListLoader,
  iamEditorFailure,
  toIamSelectRecords,
  type IamSelectOption,
} from "@ingot/admin-common";
import { TenantGroupPageAPI } from "@/api/iam/directory";

defineOptions({ name: "GroupPickerField" });

const model = defineModel<IamSelectOption[]>({ default: () => [] });
const dialogRef = ref<InstanceType<typeof BizIamMemberPickerDialog>>();

const privateLoad = createIamListLoader(async (page, condition) => {
  const response = await TenantGroupPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const privateOpen = (): void => {
  dialogRef.value?.show(model.value.map((item) => ({ ...item })));
};

const privateConfirm = (items: IamSelectOption[]): void => {
  model.value = items.map((item) => ({ id: item.id, name: item.name }));
};

const privateRemove = (id: string): void => {
  model.value = model.value.filter((item) => item.id !== id);
};
</script>
