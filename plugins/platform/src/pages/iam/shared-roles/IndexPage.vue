<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="共享角色只读浏览与发布。租户可直接分配或基于固定版本定制。" />
    </template>
    <in-split-layout>
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
            v-model="paging.condition.name"
            class="w-200px!"
            clearable
            placeholder="搜索角色名"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <biz-iam-record-link
            :action="IamAction.PLATFORM_SHARED_ROLE_READ"
            :capabilities="item.capabilities"
            @click="handleDetail(item)"
          >
            {{ item.record.name || item.record.id }}
          </biz-iam-record-link>
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <biz-iam-role-create-drawer
    ref="createRef"
    title="发布共享角色"
    :kind="RoleKind.SHARED"
    :create-api="PlatformSharedRoleCreateAPI"
    @success="refreshData"
  />
  <biz-iam-role-detail-drawer
    ref="detailRef"
    :get-api="PlatformSharedRoleDetailAPI"
    :list-revisions-api="PlatformSharedRoleRevisionPageAPI"
    :preview-api="PlatformSharedRolePreviewAPI"
    :publish-api="PlatformSharedRolePublishAPI"
    :status-api="PlatformSharedRoleStatusAPI"
    :delete-api="PlatformSharedRoleDeleteAPI"
    :publish-action="IamAction.PLATFORM_SHARED_ROLE_PUBLISH"
    :status-action="IamAction.PLATFORM_SHARED_ROLE_STATUS"
    :delete-action="IamAction.PLATFORM_SHARED_ROLE_DELETE"
    @success="refreshData"
  />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  useCapabilities,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  BizIamRecordLink,
  BizIamRoleCreateDrawer,
  BizIamRoleDetailDrawer,
  IamAction,
  RoleKind,
} from "@ingot/admin-common";
import {
  PlatformSharedRoleCreateAPI,
  PlatformSharedRoleDeleteAPI,
  PlatformSharedRoleDetailAPI,
  PlatformSharedRolePreviewAPI,
  PlatformSharedRolePublishAPI,
  PlatformSharedRoleRevisionPageAPI,
  PlatformSharedRoleStatusAPI,
} from "@/api/iam/authorization";
import {
  createRowActions,
  createToolbarActions,
  tableHeaders,
  TABLE_ID,
  type Row,
} from "./table";
import { useOps } from "./useOps";

const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const selectedColumnProps = ref<string[]>([]);
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (id: string) => void }>();
const toolbarRow = {
  record: { id: "" },
  fieldAccess: {},
  capabilities: {},
  version: "",
} as Row;

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item.record.id);
};
const handleCreate = (): void => {
  createRef.value?.show();
};
const toolbarActions = computed(() => createToolbarActions(handleCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, { onDetail: handleDetail });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
