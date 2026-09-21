<template>
  <biz-iam-group-edit-drawer
    ref="inner"
    :load-members="loadMembers"
    :create-api="PlatformGroupCreateAPI"
    :get-api="PlatformGroupDetailAPI"
    :update-api="PlatformGroupUpdateAPI"
    :preview-api="PlatformGroupPreviewAPI"
    @success="emits('success')"
  />
</template>

<script setup lang="ts">
import {
  BizIamGroupEditDrawer,
  createIamOptionLoader,
  SelectionPurpose,
  toIamSelectRecords,
  type GroupRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformGroupCreateAPI,
  PlatformGroupDetailAPI,
  PlatformGroupPreviewAPI,
  PlatformGroupUpdateAPI,
  PlatformMemberPageAPI,
} from "@/api/iam/personnel";
import type { GroupRow } from "../groupTable";

defineOptions({ name: "GroupEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const inner = ref<{ show: (row?: ResourceDetail<GroupRecord>) => void }>();

const loadMembers = createIamOptionLoader(async (page, condition) => {
  const response = await PlatformMemberPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
}, SelectionPurpose.DIRECTORY);

defineExpose({
  show(row?: GroupRow) {
    inner.value?.show(row);
  },
});
</script>
