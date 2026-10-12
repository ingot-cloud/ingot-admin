<template>
  <div class="security-access-list-panel">
    <in-table
      :loading="policyQuery.isFetching.value"
      :data="tableData"
      :headers="visibleHeaders"
      :table-id="CHALLENGE_POLICY_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="challengePolicyTableHeaders"
          :table-id="CHALLENGE_POLICY_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #target="{ item }">
        <span>{{ privateFormatTarget(item) }}</span>
      </template>
      <template #trigger="{ item }">
        <in-tag-enum :value="item.trigger" :enumObj="challengeTriggerEnum" />
      </template>
      <template #challengeType="{ item }">
        <in-tag-enum :value="item.challengeType" :enumObj="challengeTypeEnum" />
      </template>
      <template #enabled="{ item }">
        <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
          {{ item.enabled ? "启用" : "停用" }}
        </el-tag>
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
    <ChallengePolicyDrawer ref="drawerRef" @success="privateRefresh" />
  </div>
</template>

<script setup lang="ts">
import { useActiveSecurityRead, SecurityAction } from "@/hooks/useSecurityTabs";
const enabled = useActiveSecurityRead(SecurityAction.POLICY_READ, "challenge");

import { applyColumnSelection, useCapabilities, type InTableAction } from "@ingot/admin-core";
import type { GatewayChallengePolicy } from "@/models";
import { useChallengeTriggerEnum, useChallengeTypeEnum } from "@/models/enums";
import {
  ChallengePolicyListQueryOptions,
  challengePolicyQueryKeys,
} from "@/api/security/policy.query";
import {
  CHALLENGE_POLICY_TABLE_ID,
  challengePolicyTableHeaders,
  createChallengePolicyRowActions,
  createChallengePolicyToolbarActions,
} from "../table/challengePolicyTable";
import ChallengePolicyDrawer from "./ChallengePolicyDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

import { DeleteChallengePolicyAPI } from "@/api/security/policy";

const { hasAction } = useCapabilities();
const message = useMessage();
const queryClient = useQueryClient();
const policyQuery = useQuery(() => ({
  ...ChallengePolicyListQueryOptions(),
  enabled: enabled.value,
}));
const tableData = computed(() => policyQuery.data.value ?? []);
const drawerRef = ref<InstanceType<typeof ChallengePolicyDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: GatewayChallengePolicy = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(challengePolicyTableHeaders, selectedColumnProps.value),
);

const challengeTriggerEnum = useChallengeTriggerEnum();
const challengeTypeEnum = useChallengeTypeEnum();

const privateFormatTarget = (item: GatewayChallengePolicy): string => {
  if (item.groupCode) {
    return item.groupCode;
  }
  const firstPath = item.patternList?.find((pattern) => pattern.path)?.path;
  if (firstPath) {
    const extra = (item.patternList?.length ?? 0) > 1 ? ` 等 ${item.patternList?.length} 条` : "";
    return `${firstPath}${extra}`;
  }
  return "-";
};

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: challengePolicyQueryKeys.lists() });
};

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: GatewayChallengePolicy): void => {
  drawerRef.value?.show(item);
};

const privateOnDelete = async (item: GatewayChallengePolicy): Promise<void> => {
  if (!item.id || !hasAction(SecurityAction.POLICY_DELETE)) return;
  try {
    await DeleteChallengePolicyAPI(item.id);
    message.success("删除成功");
    privateRefresh();
  } catch {
    // 请求层统一反馈失败，保留当前列表。
  }
};

const toolbarActions = computed(() => createChallengePolicyToolbarActions(privateOnCreate));

const rowActionsOf = (item: GatewayChallengePolicy): Array<InTableAction<GatewayChallengePolicy>> =>
  createChallengePolicyRowActions(item, {
    onDetail: privateOnEdit,
    onDelete: privateOnDelete,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

defineExpose({
  refresh: privateRefresh,
});
</script>
