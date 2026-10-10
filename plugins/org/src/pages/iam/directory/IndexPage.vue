<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="浏览可见成员与部门。无管理编辑入口。" />
    </template>
    <in-split-layout left-collapsible persistence-key="org-iam-directory">
      <template #left>
        <in-tree
          :data="deptTree"
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          highlight-current
          @node-click="privateOnDept"
        />
      </template>
      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="TABLE_ID"
        :feedback="tableFeedback"
        density="compact"
        :row-key="rowKeyOf"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template #tools-start>
          <el-input
            v-if="canFilter('phone')"
            v-model="paging.condition.phone"
            class="w-200px!"
            clearable
            placeholder="手机号精确筛选"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <el-input
            v-if="canFilter('email')"
            v-model="paging.condition.email"
            class="w-200px!"
            clearable
            placeholder="邮箱精确筛选"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-table-column-setting
            :headers="availableHeaders"
            :table-id="TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #displayName="{ item }">
          <biz-iam-record-link
            v-if="isFieldVisible(item.fieldAccess, 'displayName')"
            :action="IamAction.TENANT_DIRECTORY_READ"
            :capabilities="item.capabilities"
            @click="handleDetail(item)"
          >
            {{ item.record.displayName }}
          </biz-iam-record-link>
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <DirectoryMemberDrawer ref="detailRef" />
</template>

<script lang="ts" setup>
import {
  applyColumnSelection,
  useCapabilities,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import { BizIamRecordLink, IamAction, FieldVisibility, isFieldVisible } from "@ingot/admin-common";
import DirectoryMemberDrawer from "./components/DirectoryMemberDrawer.vue";
import { createRowActions, tableHeaders, TABLE_ID, type Row } from "./table";
import { useOps } from "./useOps";

const { paging, canFilter, context, deptTree, loadDepts, refreshData, privateOnDept } = useOps();
const { unavailable } = useCapabilities();
const selectedColumnProps = ref<string[]>([]);
const detailRef = ref<{ show: (row: Row) => void }>();

const availableHeaders = computed(() =>
  tableHeaders.filter(
    (header) =>
      header.prop !== "displayName" ||
      (context.value?.fieldVisibility.displayName ?? FieldVisibility.HIDDEN) !==
        FieldVisibility.HIDDEN,
  ),
);
const visibleHeaders = computed(() =>
  applyColumnSelection(availableHeaders.value, selectedColumnProps.value),
);
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, { onDetail: handleDetail });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;

onMounted(() => {
  void loadDepts();
});
</script>
