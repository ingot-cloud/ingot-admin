<template>
  <biz-iam-group-wizard
    ref="inner"
    :preview-action="IamAction.PLATFORM_GROUP_PREVIEW"
    :allow-preview="hasAction(IamAction.PLATFORM_GROUP_PREVIEW)"
    :allow-member-selection="hasAction(IamAction.PLATFORM_MEMBER_READ)"
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
import { useCapabilities } from "@ingot/admin-core";
import { IamAction, BizIamGroupWizard, type GroupRecord, type ResourceDetail } from "@ingot/admin-common";
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

const { hasAction } = useCapabilities();
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
