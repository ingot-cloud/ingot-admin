<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="共享角色可改启停并发布新版本。发布不会自动升级已有授权。" />
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
          <in-picker v-model="statusFilter" label="状态" :options="statusOptions" />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #kind="{ item }">{{ kindText(item.record.kind) }}</template>
        <template #status="{ item }">
          <biz-iam-status-tag v-if="knownStatus(item.record.status)" :status="item.record.status" />
          <span v-else>-</span>
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

  <create-wizard ref="createRef" @success="refreshData" />
  <biz-iam-role-detail-drawer
    ref="detailRef"
    :get-api="PlatformSharedRoleDetailAPI"
    :list-revisions-api="PlatformSharedRoleRevisionPageAPI"
    :preview-api="PlatformSharedRolePreviewAPI"
    :publish-api="PlatformSharedRolePublishAPI"
    :status-api="PlatformSharedRoleStatusAPI"
    :publish-action="IamAction.PLATFORM_SHARED_ROLE_PUBLISH"
    :status-action="IamAction.PLATFORM_SHARED_ROLE_STATUS"
    :load-applications="loadGrantApplications"
    :load-actions="loadGrantActions"
    :resolve-actions="resolveGrantActions"
    @success="refreshData"
  />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  Confirm,
  Message,
  resolveStringPickerFilter,
  toStringPickerValue,
  useCapabilities,
  withAllPickerOption,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  BizIamRecordLink,
  BizIamRoleDetailDrawer,
  BizIamStatusTag,
  ConfigurationStatus,
  IamAction,
  useConfigurationStatusEnum,
  useRoleKindEnum,
  type RoleKind as RoleKindValue,
} from "@ingot/admin-common";
import {
  PlatformSharedRoleDeleteAPI,
  PlatformSharedRoleDetailAPI,
  PlatformSharedRolePreviewAPI,
  PlatformSharedRolePublishAPI,
  PlatformSharedRoleRevisionPageAPI,
  PlatformSharedRoleStatusAPI,
} from "@/api/iam/authorization";
import CreateWizard from "./components/CreateWizard.vue";
import {
  createRowActions,
  createToolbarActions,
  tableHeaders,
  TABLE_ID,
  type Row,
} from "./table";
import { loadGrantActions, loadGrantApplications, resolveGrantActions } from "./actionCatalog";
import { useOps } from "./useOps";

const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const kindEnum = useRoleKindEnum();
const statusEnum = useConfigurationStatusEnum();
const statusOptions = computed(() => withAllPickerOption(statusEnum.getOptions()));
const statusFilter = computed({
  get: () => toStringPickerValue(paging.condition.status),
  set: (value: string | number | boolean | null) => {
    paging.condition.status = resolveStringPickerFilter(value);
    refreshData();
  },
});
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
const handleDelete = (item: Row): void => {
  Confirm.error(`未引用角色才会删除。是否删除（${item.record.name || item.record.id}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    PlatformSharedRoleDeleteAPI(item.record.id).then(() => {
      Message.success("已删除");
      refreshData();
    });
  });
};
const kindText = (kind?: RoleKindValue): string => {
  if (!kind) {
    return "-";
  }
  const text = kindEnum.getTagText(kind, { text: "", tag: "info" }).text;
  return text || "-";
};
const knownStatus = (status?: ConfigurationStatus): status is ConfigurationStatus =>
  status === ConfigurationStatus.ENABLED || status === ConfigurationStatus.DISABLED;
const toolbarActions = computed(() => createToolbarActions(handleCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, { onDetail: handleDetail, onDelete: handleDelete });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
