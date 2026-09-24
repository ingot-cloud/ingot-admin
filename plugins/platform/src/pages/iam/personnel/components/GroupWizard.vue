<template>
  <biz-iam-group-wizard
    ref="inner"
    :load-members="loadPlatformMemberOptions"
    :load-selected="loadPlatformMembersByIds"
    :create-api="PlatformGroupCreateAPI"
    :get-api="PlatformGroupDetailAPI"
    :update-api="PlatformGroupUpdateAPI"
    :preview-api="PlatformGroupPreviewAPI"
    @success="emits('success')"
  />
</template>

<script setup lang="ts">
import { BizIamGroupWizard, type GroupRecord, type ResourceDetail } from "@ingot/admin-common";
import {
  PlatformGroupCreateAPI,
  PlatformGroupDetailAPI,
  PlatformGroupPreviewAPI,
  PlatformGroupUpdateAPI,
} from "@/api/iam/personnel";
import type { GroupRow } from "../groupTable";
import { loadPlatformMemberOptions, loadPlatformMembersByIds } from "../iamMemberOptions";

defineOptions({ name: "GroupWizard" });

const emits = defineEmits<{ success: [] }>();
const inner = ref<{ show: (row?: ResourceDetail<GroupRecord>) => void }>();

defineExpose({
  show(row?: GroupRow) {
    inner.value?.show(row);
  },
});
</script>
