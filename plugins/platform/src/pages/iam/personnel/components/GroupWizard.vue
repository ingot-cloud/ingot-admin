<template>
  <biz-iam-group-wizard
    ref="inner"
    :load-members="loadPlatformMemberOptions"
    :load-bound="loadBoundMembers"
    :create-api="PlatformGroupCreateAPI"
    :get-api="PlatformGroupDetailAPI"
    :update-api="PlatformGroupUpdateAPI"
    :preview-api="PlatformGroupPreviewAPI"
    @success="emits('success')"
  />
</template>

<script setup lang="ts">
import { BizIamGroupWizard, type GroupRecord, type ResourceDetail } from "@ingot/admin-common";
import type { LoadDataParams } from "@ingot/admin-core";
import {
  PlatformGroupCreateAPI,
  PlatformGroupDetailAPI,
  PlatformGroupPreviewAPI,
  PlatformGroupUpdateAPI,
} from "@/api/iam/personnel";
import type { GroupRow } from "../groupTable";
import { loadPlatformGroupBoundMembers, loadPlatformMemberOptions } from "../iamMemberOptions";

defineOptions({ name: "GroupWizard" });

const emits = defineEmits<{ success: [] }>();
const inner = ref<{ show: (row?: ResourceDetail<GroupRecord>) => void }>();

const loadBoundMembers = (params: LoadDataParams & { groupId: string }) =>
  loadPlatformGroupBoundMembers(params.groupId, params);

defineExpose({
  show(row?: GroupRow) {
    inner.value?.show(row);
  },
});
</script>
