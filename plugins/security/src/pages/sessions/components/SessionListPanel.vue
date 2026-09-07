<template>
  <div class="session-list-panel">
    <in-table
      :loading="loading"
      :data="pageInfo.records"
      :headers="visibleHeaders"
      :page="pageInfo"
      :table-id="SESSIONS_TABLE_ID"
      density="compact"
      row-key="sid"
      @handleSizeChange="fetchData"
      @handleCurrentChange="fetchData"
    >
      <template #title>在线会话</template>
      <template v-if="isClientOnlyQuery" #subtitle>
        按在线用户翻页；多会话时当页条数可能大于每页条数
      </template>
      <template #tools-start>
        <el-input
          v-model="condition.userId"
          class="w-200px!"
          clearable
          placeholder="搜索用户 ID"
          :prefix-icon="Search"
          @keyup.enter="privateOnSearch"
          @clear="privateOnSearch"
        />
        <in-filter-panel :active-count="extraFilterCount">
          <div class="session-list-panel__filter-field">
            <span class="session-list-panel__filter-label">组织</span>
            <TenantSelect v-model="condition.tenantId" class="w-full" />
          </div>
          <div class="session-list-panel__filter-field">
            <span class="session-list-panel__filter-label">客户端</span>
            <ClientIdField v-model="condition.clientId" :default-select-index="0" />
          </div>
          <el-input
            v-model="condition.ipAddress"
            class="w-full"
            clearable
            placeholder="搜索登录 IP"
            :prefix-icon="Search"
            @keyup.enter="privateOnSearch"
            @clear="privateOnSearch"
          />
          <template #footer>
            <in-button @click="privateOnResetExtra">重置</in-button>
          </template>
        </in-filter-panel>
        <in-table-column-setting
          :headers="tableHeaders"
          :table-id="SESSIONS_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #user="{ item }">
        <in-avatar :src="item.avatar" :name="displaySessionUser(item)" />
      </template>
      <template #tenantName="{ item }">
        {{ displaySessionTenant(item) }}
      </template>
      <template #authType="{ item }">
        <in-tag-enum v-if="item.authType" :value="item.authType" :enumObj="tokenAuthMethodEnum" />
        <span v-else>-</span>
      </template>
      <template #userType="{ item }">
        <in-tag-enum v-if="item.userType" :value="item.userType" :enumObj="sessionUserTypeEnum" />
        <span v-else>-</span>
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
    <SessionDetailDrawer ref="detailDrawerRef" @missing="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import { TenantSelect } from "@ingot/admin-common";
import { Search } from "@element-plus/icons-vue";
import type { PlatformSessionVO } from "@/models";
import { hasSessionQueryConstraint } from "@/api/security/session.query";
import { useSessionUserTypeEnum, useTokenAuthMethodEnum } from "@/models/enums";
import { createSessionRowActions, SESSIONS_TABLE_ID, tableHeaders } from "../table.ts";
import { useOps } from "../useOps.ts";
import { displaySessionTenant, displaySessionUser } from "../sessionDisplay.ts";
import ClientIdField from "./ClientIdField.vue";
import SessionDetailDrawer from "./SessionDetailDrawer.vue";

const {
  loading,
  condition,
  pageInfo,
  isClientOnlyQuery,
  resetExtraFilters,
  fetchData,
  revokeBySid,
  revokeByUser,
} = useOps();

const tokenAuthMethodEnum = useTokenAuthMethodEnum();
const sessionUserTypeEnum = useSessionUserTypeEnum();
const detailDrawerRef = ref<InstanceType<typeof SessionDetailDrawer>>();
const selectedColumnProps = ref<string[]>([]);

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const extraFilterCount = computed(
  () => [condition.tenantId, condition.clientId, condition.ipAddress].filter(Boolean).length,
);

const privateOnSearch = (): void => {
  fetchData();
};

const privateOnResetExtra = (): void => {
  resetExtraFilters();
};

const privateOnDetail = (item: PlatformSessionVO): void => {
  if (!item.sid) {
    return;
  }
  detailDrawerRef.value?.show(item.sid);
};

const rowActionsOf = (item: PlatformSessionVO): Array<InTableAction<PlatformSessionVO>> =>
  createSessionRowActions(item, {
    onDetail: privateOnDetail,
    onRevokeSid: revokeBySid,
    onRevokeUser: revokeByUser,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

watch(
  () => condition.clientId,
  (clientId) => {
    if (clientId) {
      fetchData();
    }
  },
);

watch(
  () => condition.tenantId,
  () => {
    if (hasSessionQueryConstraint(condition)) {
      fetchData();
    }
  },
);
</script>

<style lang="postcss" scoped>
.session-list-panel {
  @apply flex flex-col;
}

.session-list-panel__filter-field {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-1);
}

.session-list-panel__filter-label {
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-body);
}
</style>
