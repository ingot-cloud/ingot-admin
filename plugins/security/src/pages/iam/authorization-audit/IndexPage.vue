<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="授权审计。导出为独立操作，当前契约未单列导出路径，本页仅提供查询。" />
    </template>
    <in-split-layout>
      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="tableHeaders"
        table-id="security-iam-authorization-audit"
        density="compact"
        :row-key="rowKeyOf"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template #tools-start>
          <in-picker v-model="domainFilter" label="管理域" :options="domainOptions" />
        </template>
        <template #changeType="{ item }">{{ item.record.changeType }}</template>
        <template #timestamp="{ item }">{{ item.record.timestamp }}</template>
      </in-table>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import {
  useCapabilities,
  useServerPaging,
  withAllPickerOption,
  resolveStringPickerFilter,
  toStringPickerValue,
} from "@ingot/admin-core";
import {
  AuthorizationDomain,
  useAuthorizationDomainEnum,
  type AuditEntry,
  type IamListQuery,
  type ResourceDetail,
} from "@ingot/admin-common";
import { SecurityAuditPageQueryOptions } from "@/api/iam/policies.query";
import { tableHeaders } from "./table";

const { unavailable } = useCapabilities();
const paging = useServerPaging<ResourceDetail<AuditEntry>, IamListQuery>({
  queryOptions: SecurityAuditPageQueryOptions,
  enabled: () => !unavailable.value,
});
const domainEnum = useAuthorizationDomainEnum();
const domainOptions = computed(() => withAllPickerOption(domainEnum.getOptions()));
const domainFilter = computed({
  get: () => toStringPickerValue(paging.condition.domain),
  set: (value: string | number | boolean | null) => {
    paging.condition.domain = resolveStringPickerFilter(value);
    paging.search();
  },
});

const rowKeyOf = (row: ResourceDetail<AuditEntry>): string =>
  row.record.traceId || row.record.timestamp || row.version;
</script>
