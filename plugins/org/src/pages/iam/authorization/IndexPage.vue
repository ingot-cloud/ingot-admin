<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="角色、授权记录与授权管理员。诊断为工具入口，不提供模拟执行。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel title="角色" name="roles">
          <in-table
            :loading="roles.paging.fetching.value"
            :data="roles.paging.pageInfo.value.records"
            :page="roles.paging.pageInfo.value"
            :headers="roleHeaders"
            table-id="org-iam-roles"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="roles.paging.fetchData"
            @handleCurrentChange="roles.paging.fetchData"
          >
            <template #name="{ item }">{{ item.record.name }}</template>
            <template #kind="{ item }">{{ item.record.kind }}</template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="授权记录" name="assignments">
          <in-table
            :loading="assignments.paging.fetching.value"
            :data="assignments.paging.pageInfo.value.records"
            :page="assignments.paging.pageInfo.value"
            :headers="assignmentHeaders"
            table-id="org-iam-assignments"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="assignments.paging.fetchData"
            @handleCurrentChange="assignments.paging.fetchData"
          >
            <template #subject="{ item }">
              {{ item.record.assignment.subject.type }} / {{ item.record.assignment.subject.id }}
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="授权管理员" name="delegations">
          <in-table
            :loading="delegations.paging.fetching.value"
            :data="delegations.paging.pageInfo.value.records"
            :page="delegations.paging.pageInfo.value"
            :headers="delegationHeaders"
            table-id="org-iam-delegations"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="delegations.paging.fetchData"
            @handleCurrentChange="delegations.paging.fetchData"
          >
            <template #administratorMemberId="{ item }">
              {{ item.record.delegation.administratorMemberId }}
            </template>
          </in-table>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import type { TableHeaderRecord } from "@ingot/admin-core";
import { useServerPaging, useCapabilities } from "@ingot/admin-core";
import type { AssignmentRecord, DelegationRecord, IamListQuery, ResourceDetail, RoleSummary } from "@ingot/admin-common";
import {
  TenantAssignmentPageQueryOptions,
  TenantDelegationPageQueryOptions,
  TenantRolePageQueryOptions,
} from "@/api/iam/authorization.query";

const tab = ref("roles");
const { unavailable } = useCapabilities();
const enabled = () => !unavailable.value;

const roles = {
  paging: useServerPaging<ResourceDetail<RoleSummary>, IamListQuery>({
    queryOptions: TenantRolePageQueryOptions,
    enabled,
  }),
};
const assignments = {
  paging: useServerPaging<ResourceDetail<AssignmentRecord>, IamListQuery>({
    queryOptions: TenantAssignmentPageQueryOptions,
    enabled,
  }),
};
const delegations = {
  paging: useServerPaging<ResourceDetail<DelegationRecord>, IamListQuery>({
    queryOptions: TenantDelegationPageQueryOptions,
    enabled,
  }),
};

const roleHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "来源", prop: "kind" },
  { label: "状态", prop: "status" },
];
const assignmentHeaders: Array<TableHeaderRecord> = [
  { label: "主体", prop: "subject", required: true },
];
const delegationHeaders: Array<TableHeaderRecord> = [
  { label: "管理员", prop: "administratorMemberId", required: true },
];

const rowKeyOf = (row: ResourceDetail<{ id: string }>): string => row.record.id;
</script>
