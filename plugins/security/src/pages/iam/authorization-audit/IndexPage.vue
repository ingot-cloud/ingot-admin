<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header
        :title="title"
        description="查看当前管理范围内的授权变更、配置差异与关联记录。"
      />
    </template>
    <in-split-layout>
      <in-table
        :loading="paging.fetching.value"
        :data="pageInfo.records"
        :page="pageInfo"
        :headers="visibleHeaders"
        :table-id="TABLE_ID"
        :feedback="feedback"
        density="compact"
        :row-key="rowKeyOf"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template v-if="canRead" #tools-start>
          <el-input
            v-model="paging.condition.actorMemberId"
            class="w-220px!"
            clearable
            placeholder="精确查询操作者成员 ID"
            :prefix-icon="Search"
            @keyup.enter="paging.search"
            @clear="paging.search"
          />
          <in-filter-panel :active-count="extraFilterCount">
            <in-picker v-model="changeFilter" label="变更类型" :options="changeOptions" />
            <el-input
              v-model="paging.condition.targetType"
              clearable
              placeholder="精确查询对象类型编码"
              :prefix-icon="Search"
              @keyup.enter="paging.search"
              @clear="paging.search"
            />
            <el-input
              v-model="paging.condition.targetId"
              clearable
              placeholder="精确查询对象 ID"
              :prefix-icon="Search"
              @keyup.enter="paging.search"
              @clear="paging.search"
            />
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              class="w-full!"
              clearable
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              range-separator="至"
            />
            <span class="text-12px text-[var(--in-text-color-secondary)]"
              >包含开始时间，不包含结束时间</span
            >
            <template #footer><in-button @click="resetExtraFilters">重置</in-button></template>
          </in-filter-panel>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #timestamp="{ item }">{{ formatDateTime(item.record.timestamp) }}</template>
        <template #actor="{ item }">{{ auditActor(item.record) }}</template>
        <template #changeType="{ item }">
          <biz-iam-record-link
            v-if="action"
            :action="action"
            :capabilities="item.capabilities"
            @click="openDetail(item)"
          >
            {{ auditChange(item.record) }}
          </biz-iam-record-link>
        </template>
        <template #target="{ item }">{{ auditTarget(item.record) }}</template>
        <template #changeSummary="{ item }"
          ><span :title="auditSummary(item.record)">{{ auditSummary(item.record) }}</span></template
        >
        <template #error>
          <el-empty description="暂时无法加载授权审计">
            <in-button v-if="canRead" @click="paging.search">重试</in-button>
          </el-empty>
        </template>
        <template #unauthorized><el-empty description="没有查看当前域授权审计的权限" /></template>
      </in-table>
    </in-split-layout>
    <AuditDetailDrawer v-model="detailVisible" :entry="detail?.record" />
  </in-page-frame>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import { formatDateTime } from "@ingot/shared";
import { applyColumnSelection, withAllPickerOption } from "@ingot/admin-core";
import {
  BizIamRecordLink,
  useAuditChangeTypeEnum,
  type AuditEntry,
  type ResourceDetail,
} from "@ingot/admin-common";
import { tableHeaders, TABLE_ID } from "./table";
import { useOps } from "./useOps";
import { auditActor, auditChange, auditTarget, auditSummary } from "./display";
import AuditDetailDrawer from "./components/AuditDetailDrawer.vue";
const {
  paging,
  pageInfo,
  title,
  feedback,
  canRead,
  action,
  changeFilter,
  timeRange,
  extraFilterCount,
  resetExtraFilters,
  detail,
  detailVisible,
  openDetail,
} = useOps();
const changeEnum = useAuditChangeTypeEnum();
const changeOptions = computed(() => withAllPickerOption(changeEnum.getOptions()));
const selectedColumns = ref<string[]>([]);
const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumns.value));
const privateOnColumnChange = (columns: string[]): void => {
  selectedColumns.value = columns;
};
const rowKeyOf = (row: ResourceDetail<AuditEntry>): string => row.record.id;
</script>
