<template>
  <div class="concurrency-policy-panel">
    <div class="concurrency-policy-panel__tip">
      策略按客户端优先于用户类型、再优先于全局命中即止，不做字段合并。调整后仅对下次登录生效，已在线会话不受影响。
    </div>
    <in-table
      :loading="loading"
      :data="tableData"
      :headers="visibleHeaders"
      :table-id="SESSIONS_POLICY_TABLE_ID"
      density="compact"
      row-key="id"
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="policyTableHeaders"
          :table-id="SESSIONS_POLICY_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #scope="{ item }">
        <in-tag-enum :value="item.scope" :enumObj="scopeEnum" />
      </template>
      <template #clientId="{ item }">
        {{ item.clientId || "-" }}
      </template>
      <template #userType="{ item }">
        <in-tag-enum v-if="item.userType" :value="item.userType" :enumObj="userTypeEnum" />
        <span v-else>-</span>
      </template>
      <template #maxSessions="{ item }">
        {{ item.maxSessions === 0 ? "不限制" : item.maxSessions }}
      </template>
      <template #overflow="{ item }">
        <in-tag-enum :value="item.overflow" :enumObj="overflowEnum" />
      </template>
      <template #adminForbidConcurrent="{ item }">
        <el-tag :type="item.adminForbidConcurrent ? 'warning' : 'info'" size="small">
          {{ item.adminForbidConcurrent ? "是" : "否" }}
        </el-tag>
      </template>
      <template #enabled="{ item }">
        <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
          {{ item.enabled ? "启用" : "停用" }}
        </el-tag>
      </template>
      <template #remark="{ item }">
        {{ item.remark || "-" }}
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
    <ConcurrencyPolicyDrawer ref="drawerRef" @success="loadAll" />
  </div>
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { SessionConcurrencyPolicy } from "@/models";
import {
  useSessionConcurrencyOverflowEnum,
  useSessionConcurrencyScopeEnum,
  useSessionUserTypeEnum,
} from "@/models/enums";
import {
  createConcurrencyPolicyRowActions,
  createConcurrencyPolicyToolbarActions,
  policyTableHeaders,
  SESSIONS_POLICY_TABLE_ID,
} from "../policyTable.ts";
import { useConcurrencyPolicy } from "../useConcurrencyPolicy.ts";
import ConcurrencyPolicyDrawer from "./ConcurrencyPolicyDrawer.vue";

const { loading, tableData, loadAll, removePolicy } = useConcurrencyPolicy();
const scopeEnum = useSessionConcurrencyScopeEnum();
const overflowEnum = useSessionConcurrencyOverflowEnum();
const userTypeEnum = useSessionUserTypeEnum();
const drawerRef = ref<InstanceType<typeof ConcurrencyPolicyDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: SessionConcurrencyPolicy = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(policyTableHeaders, selectedColumnProps.value),
);

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: SessionConcurrencyPolicy): void => {
  drawerRef.value?.show(item);
};

const toolbarActions = computed(() => createConcurrencyPolicyToolbarActions(privateOnCreate));

const rowActionsOf = (
  item: SessionConcurrencyPolicy,
): Array<InTableAction<SessionConcurrencyPolicy>> =>
  createConcurrencyPolicyRowActions(item, {
    onDetail: privateOnEdit,
    onDelete: removePolicy,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

onMounted(() => {
  loadAll();
});
</script>

<style lang="postcss" scoped>
.concurrency-policy-panel {
  @apply flex flex-col px-12px pt-10px pb-16px;

  & .concurrency-policy-panel__tip {
    @apply mb-12px text-13px text-[var(--in-text-color-secondary)];
  }
}
</style>
