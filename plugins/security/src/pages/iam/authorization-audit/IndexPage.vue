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
        <template #changeType="{ item }">
          <in-button text link @click="handleDetail(item)">
            {{ item.record.changeType || item.record.traceId || "详情" }}
          </in-button>
        </template>
        <template #timestamp="{ item }">{{ item.record.timestamp }}</template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <in-drawer v-model="detailVisible" title="审计详情" size="560px">
    <el-form v-if="detail" label-position="top">
      <el-form-item label="类型">
        <span>{{ detail.record.changeType || "—" }}</span>
      </el-form-item>
      <el-form-item label="时间">
        <span>{{ detail.record.timestamp || "—" }}</span>
      </el-form-item>
      <el-form-item label="操作者">
        <span>{{ detail.record.actor?.displayName || detail.record.actor?.memberId || "—" }}</span>
      </el-form-item>
      <el-form-item label="对象">
        <span>{{ detail.record.target?.name || detail.record.target?.id || "—" }}</span>
      </el-form-item>
      <el-form-item label="追踪">
        <span>{{ detail.record.traceId || "—" }}</span>
      </el-form-item>
      <el-form-item label="变更前">
        <pre class="whitespace-pre-wrap text-12px">{{ stringify(detail.record.before) }}</pre>
      </el-form-item>
      <el-form-item label="变更后">
        <pre class="whitespace-pre-wrap text-12px">{{ stringify(detail.record.after) }}</pre>
      </el-form-item>
    </el-form>
  </in-drawer>
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
const detailVisible = ref(false);
const detail = ref<ResourceDetail<AuditEntry>>();

const stringify = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "—";
  }
  return JSON.stringify(value, null, 2);
};

const handleDetail = (row: ResourceDetail<AuditEntry>): void => {
  detail.value = row;
  detailVisible.value = true;
};

const rowKeyOf = (row: ResourceDetail<AuditEntry>): string =>
  row.record.traceId || row.record.timestamp || row.version;
</script>
