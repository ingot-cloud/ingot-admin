<template>
  <div class="session-list-panel">
    <in-filter-item class="session-list-panel__filters">
      <in-with-label title="组织">
        <div class="filter-control">
          <TenantSelect v-model="condition.tenantId" />
        </div>
      </in-with-label>
      <in-with-label title="客户端">
        <div class="filter-control">
          <ClientIdField v-model="condition.clientId" :default-select-index="0" />
        </div>
      </in-with-label>
      <in-with-label title="用户 ID">
        <el-input
          v-model="condition.userId"
          class="filter-control"
          clearable
          placeholder="跨客户端查询"
        />
      </in-with-label>
      <in-with-label title="登录 IP">
        <el-input
          v-model="condition.ipAddress"
          class="filter-control"
          clearable
          placeholder="需同时选择客户端"
        />
      </in-with-label>
      <template #rightActions>
        <in-button @click="privateOnReset">重置</in-button>
        <in-button type="primary" :loading="loading" @in-click="fetchData">搜索</in-button>
      </template>
    </in-filter-item>

    <in-table
      :loading="loading"
      :data="pageInfo.records"
      :headers="tableHeaders"
      :page="pageInfo"
      row-key="sid"
      @refresh="fetchData"
      @handleSizeChange="fetchData"
      @handleCurrentChange="fetchData"
    >
      <template #title>在线会话</template>
      <template v-if="isClientOnlyQuery" #subtitle>
        按在线用户翻页；多会话时当页条数可能大于每页条数
      </template>
      <template #user="{ item }">
        <div flex flex-row items-center gap-2>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          <span>{{ displaySessionUser(item) }}</span>
        </div>
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
        <in-button text link type="primary" @click="privateOnDetail(item)">详情</in-button>
        <in-button v-auth-any="revokeAuths" text link type="danger" @click="revokeBySid(item)">
          强制下线
        </in-button>
        <in-button v-auth-any="revokeAuths" text link type="danger" @click="revokeByUser(item)">
          下线该用户
        </in-button>
      </template>
    </in-table>
    <SessionDetailDrawer ref="detailDrawerRef" @missing="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { TenantSelect } from "@ingot/admin-common";
import type { PlatformSessionVO } from "@/models";
import { useSessionUserTypeEnum, useTokenAuthMethodEnum } from "@/models/enums";
import { ROLE_SYSTEM_ADMIN_CODE } from "@ingot/admin-core";
import { tableHeaders } from "../table.ts";
import { useOps } from "../useOps.ts";
import { SESSION_REVOKE_PERMISSION } from "../constants.ts";
import { displaySessionTenant, displaySessionUser } from "../sessionDisplay.ts";
import ClientIdField from "./ClientIdField.vue";
import SessionDetailDrawer from "./SessionDetailDrawer.vue";

const {
  loading,
  condition,
  pageInfo,
  isClientOnlyQuery,
  resetFilter,
  fetchData,
  revokeBySid,
  revokeByUser,
} = useOps();

const tokenAuthMethodEnum = useTokenAuthMethodEnum();
const sessionUserTypeEnum = useSessionUserTypeEnum();
const revokeAuths = [SESSION_REVOKE_PERMISSION, ROLE_SYSTEM_ADMIN_CODE];
const detailDrawerRef = ref<InstanceType<typeof SessionDetailDrawer>>();

const privateOnReset = (): void => {
  resetFilter();
};

const privateOnDetail = (item: PlatformSessionVO): void => {
  if (!item.sid) {
    return;
  }
  detailDrawerRef.value?.show(item.sid);
};

watch(
  () => condition.clientId,
  (clientId) => {
    if (clientId) {
      fetchData();
    }
  },
);
</script>

<style lang="postcss" scoped>
.session-list-panel {
  @apply flex flex-col;

  & .session-list-panel__filters {
    @apply px-12px pt-10px pb-12px mb-4;
  }

  & .filter-control {
    @apply w-200px;
  }
}
</style>
