<template>
  <div class="concurrency-policy-panel">
    <div class="concurrency-policy-panel__tip">
      策略按客户端优先于用户类型、再优先于全局命中即止，不做字段合并。调整后仅对下次登录生效，已在线会话不受影响。
    </div>
    <in-table
      :loading="loading"
      :data="tableData"
      :headers="policyTableHeaders"
      row-key="id"
      @refresh="loadAll"
    >
      <template #toolbar>
        <in-button v-auth-any="updateAuths" type="primary" @click="privateOnCreate">
          <template #icon>
            <i-ep:plus />
          </template>
          新建策略
        </in-button>
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
        <in-button v-auth-any="updateAuths" type="primary" text link @click="privateOnEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
        <el-tooltip
          v-if="item.scope === SessionConcurrencyScopeEnum.GLOBAL"
          content="全局兜底策略不可删除，可将最大会话数改为 0 以关闭限制"
          placement="top"
        >
          <span v-auth-any="updateAuths">
            <in-button type="danger" text link disabled>删除</in-button>
          </span>
        </el-tooltip>
        <in-button
          v-else
          v-auth-any="updateAuths"
          type="danger"
          text
          link
          @click="removePolicy(item)"
        >
          删除
        </in-button>
      </template>
    </in-table>
    <ConcurrencyPolicyDrawer ref="drawerRef" @success="loadAll" />
  </div>
</template>

<script setup lang="ts">
import type { SessionConcurrencyPolicy } from "@/models";
import {
  SessionConcurrencyScopeEnum,
  useSessionConcurrencyOverflowEnum,
  useSessionConcurrencyScopeEnum,
  useSessionUserTypeEnum,
} from "@/models/enums";
import { ROLE_SYSTEM_ADMIN_CODE } from "@/constants/role";
import { policyTableHeaders } from "../policyTable";
import { useConcurrencyPolicy } from "../useConcurrencyPolicy";
import { SESSION_POLICY_UPDATE_PERMISSION } from "../constants";
import ConcurrencyPolicyDrawer from "./ConcurrencyPolicyDrawer.vue";

const { loading, tableData, loadAll, removePolicy } = useConcurrencyPolicy();
const scopeEnum = useSessionConcurrencyScopeEnum();
const overflowEnum = useSessionConcurrencyOverflowEnum();
const userTypeEnum = useSessionUserTypeEnum();
const updateAuths = [SESSION_POLICY_UPDATE_PERMISSION, ROLE_SYSTEM_ADMIN_CODE];
const drawerRef = ref<InstanceType<typeof ConcurrencyPolicyDrawer>>();

const privateOnCreate = (): void => {
  drawerRef.value?.show();
};

const privateOnEdit = (item: SessionConcurrencyPolicy): void => {
  drawerRef.value?.show(item);
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
