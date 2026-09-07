<template>
  <div class="p-10px">
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
    <ChallengePolicyDrawer ref="drawerRef" :groups="groups" @success="privateRefresh" />
  </div>
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { GatewayChallengePolicy } from "@/models";
import { useChallengeTriggerEnum, useChallengeTypeEnum } from "@/models/enums";
import {
  ChallengePolicyListQueryOptions,
  EndpointGroupListQueryOptions,
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

const queryClient = useQueryClient();
const policyQuery = useQuery(() => ChallengePolicyListQueryOptions());
const groupsQuery = useQuery(() => EndpointGroupListQueryOptions());
const tableData = computed(() => policyQuery.data.value ?? []);
const groups = computed(() => groupsQuery.data.value ?? []);
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

const toolbarActions = computed(() => createChallengePolicyToolbarActions(privateOnCreate));

const rowActionsOf = (
  item: GatewayChallengePolicy,
): Array<InTableAction<GatewayChallengePolicy>> =>
  createChallengePolicyRowActions(item, {
    onDetail: privateOnEdit,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

defineExpose({
  refresh: privateRefresh,
});
</script>
