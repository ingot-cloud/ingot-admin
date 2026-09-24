<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查询、创建和维护平台组织。创建使用向导预览最小初始化结果，不复制角色模板。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="TENANT_TABLE_ID"
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
            placeholder="搜索组织名"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-picker
            v-model="statusFilter"
            label="状态"
            :options="statusOptions"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TENANT_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <div class="flex items-center gap-8px">
            <in-avatar :src="item.record.avatar" :name="item.record.name" :show-name="false" />
            <biz-iam-record-link
              :action="IamAction.PLATFORM_TENANT_READ"
              :capabilities="item.capabilities"
              @click="handleEdit(item)"
            >
              {{ item.record.name }}
            </biz-iam-record-link>
          </div>
        </template>
        <template #status="{ item }">
          <biz-iam-status-tag :status="item.record.status" />
        </template>
        <template #ownerMemberId="{ item }">
          <div class="flex flex-col">
            <span>{{ item.record.ownerDisplayName || item.record.ownerMemberId }}</span>
            <span class="text-12px text-[var(--el-text-color-secondary)]">{{ ownerContactOf(item.record) }}</span>
          </div>
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <DetailDrawer ref="detailRef" @success="refreshData" />
  <CreateWizard ref="createRef" @success="refreshData" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  resolveStringPickerFilter,
  toStringPickerValue,
  useCapabilities,
  withAllPickerOption,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  BizIamRecordLink,
  BizIamStatusTag,
  ConfigurationStatus,
  IamAction,
  useConfigurationStatusEnum,
} from "@ingot/admin-common";
import DetailDrawer from "./components/DetailDrawer.vue";
import CreateWizard from "./components/CreateWizard.vue";
import {
  createTenantRowActions,
  createTenantToolbarActions,
  tableHeaders,
  TENANT_TABLE_ID,
  type TenantRow,
} from "./table";
import { useOps } from "./useOps";
import { ownerContactOf } from "./wizard";

const detailRef = ref<{ show: (row: TenantRow) => void }>();
const createRef = ref<{ show: () => void }>();
const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow = {
  record: { id: "", name: "", ownerMemberId: "", status: ConfigurationStatus.ENABLED },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies TenantRow;
const statusEnum = useConfigurationStatusEnum();

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const statusOptions = computed(() => withAllPickerOption(statusEnum.getOptions()));

const statusFilter = computed({
  get: () => toStringPickerValue(paging.condition.status),
  set: (value: string | number | boolean | null) => {
    paging.condition.status = resolveStringPickerFilter(value);
    refreshData();
  },
});

const tableFeedback = computed<InTableFeedback>(() => {
  if (unavailable.value) {
    return "error";
  }
  return "empty";
});

const handleCreate = (): void => {
  createRef.value?.show();
};

const handleEdit = (params: TenantRow): void => {
  detailRef.value?.show(params);
};

const toolbarActions = computed(() => createTenantToolbarActions(handleCreate));

const rowActionsOf = (item: TenantRow): Array<InTableAction<TenantRow>> =>
  createTenantRowActions(item, {
    onDetail: handleEdit,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

const rowKeyOf = (row: TenantRow): string => row.record.id;
</script>
