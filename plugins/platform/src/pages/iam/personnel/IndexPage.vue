<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="平台成员资格与账号分离。组只选择平台成员，不展示租户部门。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel title="成员" name="members">
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
                placeholder="搜索显示名"
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
            <template #displayName="{ item }">
              <div class="flex items-center gap-8px">
                <in-avatar
                  :src="item.record.avatar"
                  :name="item.record.displayName || item.record.username"
                  :show-name="false"
                />
                <biz-iam-record-link
                  :action="IamAction.PLATFORM_MEMBER_READ"
                  :capabilities="item.capabilities"
                  @click="handleDetail(item)"
                >
                  {{ item.record.displayName || item.record.id }}
                </biz-iam-record-link>
              </div>
            </template>
            <template #phone="{ item }">{{ item.record.phone || "-" }}</template>
            <template #username="{ item }">{{ item.record.username || "-" }}</template>
            <template #status="{ item }">
              <status-tag
                v-if="memberStatusTone(item.record.status)"
                :tone="statusToneOf(item.record.status)"
                :label="memberStatusEnum.getTagText(item.record.status).text"
              />
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="rowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="组" name="groups" fill lazy>
          <GroupWorkspace />
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>

  <MemberCreateDrawer ref="createRef" @success="refreshData" />
  <MemberDetailDrawer ref="detailRef" @success="refreshData" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  Confirm,
  Message,
  resolveStringPickerFilter,
  StatusTag,
  toStringPickerValue,
  useCapabilities,
  withAllPickerOption,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  BizIamRecordLink,
  IamAction,
  MemberStatus,
  memberStatusTone,
  useMemberStatusEnum,
} from "@ingot/admin-common";
import { PlatformMemberRemoveAPI, PlatformMemberStatusAPI } from "@/api/iam/personnel";
import MemberCreateDrawer from "./components/MemberCreateDrawer.vue";
import MemberDetailDrawer from "./components/MemberDetailDrawer.vue";
import GroupWorkspace from "./components/GroupWorkspace.vue";
import {
  createRowActions,
  createToolbarActions,
  tableHeaders,
  TABLE_ID,
  type Row,
} from "./table";
import { useOps } from "./useOps";

const tab = ref("members");
const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const memberStatusEnum = useMemberStatusEnum();
const statusToneOf = (status: string): "info" | "warning" | "danger" =>
  memberStatusTone(status) ?? "info";
const statusOptions = computed(() => withAllPickerOption(memberStatusEnum.getOptions()));
const statusFilter = computed({
  get: () => toStringPickerValue(paging.condition.status),
  set: (value: string | number | boolean | null) => {
    paging.condition.status = resolveStringPickerFilter(value);
    refreshData();
  },
});
const selectedColumnProps = ref<string[]>([]);
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (row: Row) => void }>();
const toolbarRow = {
  record: { id: "", status: MemberStatus.ACTIVE, departments: [] },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies Row;

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const handleSuspend = (item: Row): void => {
  Confirm.warning(`暂停只影响平台身份，不删除全局账号。是否暂停（${item.record.displayName || item.record.id}）？`).then(
    () => {
      PlatformMemberStatusAPI(item.record.id, {
        expectedVersion: item.version,
        status: MemberStatus.SUSPENDED,
      }).then(() => {
        Message.success("已暂停");
        refreshData();
      });
    },
  );
};
const handleRestore = (item: Row): void => {
  Confirm.warning(`是否恢复平台成员（${item.record.displayName || item.record.id}）？`).then(() => {
    PlatformMemberStatusAPI(item.record.id, {
      expectedVersion: item.version,
      status: MemberStatus.ACTIVE,
    }).then(() => {
      Message.success("已恢复");
      refreshData();
    });
  });
};
const handleRemove = (item: Row): void => {
  Confirm.error(`移出不删除全局账号。是否移出（${item.record.displayName || item.record.id}）？`, {
    confirmButtonText: "移出",
  }).then(() => {
    PlatformMemberRemoveAPI(item.record.id, { expectedVersion: item.version }).then(() => {
      Message.success("已移出");
      refreshData();
    });
  });
};
const toolbarActions = computed(() => createToolbarActions(handleCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, {
    onDetail: handleDetail,
    onSuspend: handleSuspend,
    onRestore: handleRestore,
    onRemove: handleRemove,
  });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
