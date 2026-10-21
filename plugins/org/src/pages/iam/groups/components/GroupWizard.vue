<template>
  <biz-iam-group-wizard
    ref="inner"
    allow-departments
    organization
    :load-members="TenantMemberPickerLoad"
    :load-bound="loadBoundMembers"
    :load-browse="loadBrowse"
    :create-api="TenantGroupCreateAPI"
    :get-api="TenantGroupDetailAPI"
    :update-api="TenantGroupUpdateAPI"
    :preview-api="TenantGroupPreviewAPI"
    @success="emits('success')"
  >
    <template #departments="{ departments, change }">
      <group-department-field :model-value="departments" @update:model-value="change" />
    </template>
  </biz-iam-group-wizard>
</template>

<script setup lang="ts">
import type { LoadDataParams } from "@ingot/admin-core";
import {
  BizIamGroupWizard,
  OrganizationMemberScene,
  type GroupRecord,
  type OrganizationMemberBrowseParams,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantGroupBoundMembersLoad,
  TenantGroupCreateAPI,
  TenantGroupDetailAPI,
  TenantGroupPreviewAPI,
  TenantGroupUpdateAPI,
  TenantMemberPickerLoad,
  TenantOrganizationMemberBrowseAPI,
} from "@/api/iam/directory";
import type { GroupRow } from "../table";
import GroupDepartmentField from "./GroupDepartmentField.vue";

defineOptions({ name: "GroupWizard" });

const emits = defineEmits<{ success: [] }>();
const inner = ref<{ show: (row?: ResourceDetail<GroupRecord>) => void }>();

const loadBoundMembers = (params: LoadDataParams & { groupId: string }) =>
  TenantGroupBoundMembersLoad(params.groupId, params);

const loadBrowse = async (params: OrganizationMemberBrowseParams) => {
  const response = await TenantOrganizationMemberBrowseAPI({
    ...params,
    scene: OrganizationMemberScene.MEMBER,
  });
  return response.data;
};

defineExpose({
  show(row?: GroupRow) {
    inner.value?.show(row);
  },
});
</script>
