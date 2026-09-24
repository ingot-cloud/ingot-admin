<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护应用、资源与操作目录。启用不等于业务授权。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="domainTab">
        <in-biz-tab-panel
          v-for="item in domainTabs"
          :key="item.name"
          :title="item.title"
          :name="item.name"
          fill
        >
          <in-table
            v-if="domainTab === item.name"
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
                placeholder="搜索应用名"
                :prefix-icon="Search"
                @keyup.enter="refreshData"
                @clear="refreshData"
              />
              <in-filter-panel :active-count="extraFilterCount">
                <in-picker v-model="statusFilter" label="状态" :options="statusOptions" />
                <in-picker
                  v-if="isTenantTab"
                  v-model="baselineFilter"
                  label="组织默认"
                  :options="baselineOptions"
                />
                <template #footer>
                  <in-button @click="privateOnResetExtra">重置</in-button>
                </template>
              </in-filter-panel>
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
              <span class="inline-flex items-center gap-[var(--in-space-2)] min-w-0">
                <biz-iam-record-link
                  :action="IamAction.PLATFORM_APPLICATION_READ"
                  :capabilities="item.capabilities"
                  @click="handleDetail(item)"
                >
                  {{ item.record.name || item.record.id }}
                </biz-iam-record-link>
                <el-tag v-if="item.record.baseline" type="info" effect="plain" size="small">
                  组织默认
                </el-tag>
              </span>
            </template>
            <template #code="{ item }">
              <in-copy-tag :text="item.record.code" />
            </template>
            <template #status="{ item }">
              <biz-iam-status-tag :status="item.record.status" />
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="rowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>

  <CreateWizard ref="createRef" @success="refreshData" />
  <DetailDrawer ref="detailRef" @success="refreshData" />
  <ApplicationPurgeDialog ref="purgeRef" @success="refreshData" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  Confirm,
  isApiError,
  Message,
  resolveBooleanPickerFilter,
  resolveStringPickerFilter,
  toBooleanPickerValue,
  toStringPickerValue,
  useCapabilities,
  withAllPickerOption,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  AuthorizationDomain,
  BizIamRecordLink,
  BizIamStatusTag,
  ConfigurationStatus,
  IamAction,
  IamReasonCode,
  useConfigurationStatusEnum,
} from "@ingot/admin-common";
import { PlatformApplicationDeleteAPI, PlatformApplicationStatusAPI } from "@/api/iam/catalog";
import ApplicationPurgeDialog from "./components/ApplicationPurgeDialog.vue";
import CreateWizard from "./components/CreateWizard.vue";
import DetailDrawer from "./components/DetailDrawer.vue";
import {
  createRowActions,
  createToolbarActions,
  tableHeaders,
  TABLE_ID,
  type Row,
} from "./table";
import { useOps } from "./useOps";

const { paging, refreshData } = useOps();
const { unavailable, hasAction } = useCapabilities();
const domainTabs = [
  { name: AuthorizationDomain.PLATFORM, title: "平台应用" },
  { name: AuthorizationDomain.TENANT, title: "组织应用" },
];
const domainTab = ref(AuthorizationDomain.PLATFORM);
const isTenantTab = computed(() => domainTab.value === AuthorizationDomain.TENANT);
watch(domainTab, (domain) => {
  paging.condition.domain = domain;
  if (domain === AuthorizationDomain.PLATFORM) {
    paging.condition.baseline = undefined;
  }
  refreshData();
});
const selectedColumnProps = ref<string[]>([]);
const createRef = ref<{ show: (domain: AuthorizationDomain) => void }>();
const detailRef = ref<{ show: (row: Row) => void }>();
const purgeRef = ref<{ show: (row: Row, message: string) => void }>();
const statusEnum = useConfigurationStatusEnum();
const statusOptions = computed(() => withAllPickerOption(statusEnum.getOptions()));
const statusFilter = computed({
  get: () => toStringPickerValue(paging.condition.status),
  set: (value: string | number | boolean | null) => {
    paging.condition.status = resolveStringPickerFilter(value);
    refreshData();
  },
});
const baselineOptions = computed(() =>
  withAllPickerOption([
    { label: "是", value: true },
    { label: "否", value: false },
  ]),
);
const baselineFilter = computed({
  get: () => toBooleanPickerValue(paging.condition.baseline),
  set: (value: string | number | boolean | null) => {
    paging.condition.baseline = resolveBooleanPickerFilter(value);
    refreshData();
  },
});
const extraFilterCount = computed(() => {
  let count = 0;
  if (paging.condition.status) {
    count += 1;
  }
  if (isTenantTab.value && paging.condition.baseline !== undefined) {
    count += 1;
  }
  return count;
});
const privateOnResetExtra = (): void => {
  paging.condition.status = undefined;
  paging.condition.baseline = undefined;
  refreshData();
};
const toolbarRow = {
  record: {
    id: "",
    code: "",
    domain: AuthorizationDomain.PLATFORM,
    name: "",
    sortOrder: 0,
    baseline: false,
    status: ConfigurationStatus.ENABLED,
  },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies Row;

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const handleCreate = (): void => {
  createRef.value?.show(domainTab.value);
};
const handleEnable = (item: Row): void => {
  Confirm.warning(`启用不等于业务授权。是否启用应用（${item.record.name}）？`).then(() => {
    PlatformApplicationStatusAPI(item.record.id, {
      expectedVersion: item.version,
      status: ConfigurationStatus.ENABLED,
    }).then(() => {
      Message.success("已启用");
      refreshData();
    });
  });
};
const handleDisable = (item: Row): void => {
  Confirm.warning(
    `停用后有效访问失败，已开通记录不会自动删除。是否停用（${item.record.name}）？`,
  ).then(() => {
    PlatformApplicationStatusAPI(item.record.id, {
      expectedVersion: item.version,
      status: ConfigurationStatus.DISABLED,
    }).then(() => {
      Message.success("已停用");
      refreshData();
    });
  });
};
const handleDelete = (item: Row): void => {
  Confirm.error(`是否删除应用（${item.record.name}）？下有资源、菜单或仍被组织开通、套餐引用时无法删除。`, {
    confirmButtonText: "删除",
  }).then(() => {
    PlatformApplicationDeleteAPI(item.record.id, { feedback: "silent" })
      .then(() => {
        Message.success("已删除");
        refreshData();
      })
      .catch((error: unknown) => {
        if (isApiError(error) && error.code === IamReasonCode.OBJECT_IN_USE) {
          if (hasAction(IamAction.PLATFORM_APPLICATION_PURGE)) {
            purgeRef.value?.show(item, error.message);
            return;
          }
          Message.warning(error.message);
          return;
        }
        if (isApiError(error)) {
          Message.warning(error.message);
        }
      });
  });
};
const toolbarActions = computed(() => createToolbarActions(handleCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, {
    onDetail: handleDetail,
    onEnable: handleEnable,
    onDisable: handleDisable,
    onDelete: handleDelete,
  });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
