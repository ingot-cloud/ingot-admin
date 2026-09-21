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
              <biz-iam-record-link
                :action="IamAction.PLATFORM_MEMBER_READ"
                :capabilities="item.capabilities"
                @click="handleDetail(item)"
              >
                {{ item.record.displayName || item.record.id }}
              </biz-iam-record-link>
            </template>
            <template #status="{ item }">
              <in-tag :value="memberStatusEnum.getTagText(item.record.status)" />
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="rowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="组" name="groups">
          <in-table
            :loading="groupPaging.fetching.value"
            :data="groupPaging.pageInfo.value.records"
            :page="groupPaging.pageInfo.value"
            :headers="visibleGroupHeaders"
            :table-id="GROUP_TABLE_ID"
            :feedback="tableFeedback"
            density="compact"
            :row-key="groupKeyOf"
            @handleSizeChange="groupPaging.fetchData"
            @handleCurrentChange="groupPaging.fetchData"
          >
            <template #tools-start>
              <el-input
                v-model="groupPaging.condition.name"
                class="w-200px!"
                clearable
                placeholder="搜索组名"
                :prefix-icon="Search"
                @keyup.enter="refreshGroups"
                @clear="refreshGroups"
              />
              <in-table-column-setting
                :headers="groupHeaders"
                :table-id="GROUP_TABLE_ID"
                @change="privateOnGroupColumnChange"
              />
            </template>
            <template #tools-end>
              <in-table-actions variant="toolbar" :actions="groupToolbarActions" :row="emptyGroupRow" />
            </template>
            <template #name="{ item }">
              <biz-iam-record-link
                :action="IamAction.PLATFORM_GROUP_READ"
                :capabilities="item.capabilities"
                @click="handleGroupDetail(item)"
              >
                {{ item.record.name || item.record.id }}
              </biz-iam-record-link>
            </template>
            <template #visibleMemberCount="{ item }">
              {{ item.record.visibleMemberCount ?? "—" }}
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="groupRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>

  <MemberCreateDrawer ref="createRef" @success="refreshData" />
  <MemberDetailDrawer ref="detailRef" @success="refreshData" />
  <GroupEditDrawer ref="groupRef" @success="refreshGroups" />
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
import { BizIamRecordLink, IamAction, MemberStatus, useMemberStatusEnum } from "@ingot/admin-common";
import { PlatformGroupDeleteAPI, PlatformMemberRemoveAPI, PlatformMemberStatusAPI } from "@/api/iam/personnel";
import MemberCreateDrawer from "./components/MemberCreateDrawer.vue";
import MemberDetailDrawer from "./components/MemberDetailDrawer.vue";
import GroupEditDrawer from "./components/GroupEditDrawer.vue";
import {
  createRowActions,
  createToolbarActions,
  tableHeaders,
  TABLE_ID,
  type Row,
} from "./table";
import {
  createGroupRowActions,
  createGroupToolbarActions,
  emptyGroupRow,
  GROUP_TABLE_ID,
  groupHeaders,
  type GroupRow,
} from "./groupTable";
import { useOps } from "./useOps";

const tab = ref("members");
const { paging, groupPaging, refreshData, refreshGroups } = useOps();
const { unavailable } = useCapabilities();
const memberStatusEnum = useMemberStatusEnum();
const statusOptions = computed(() => withAllPickerOption(memberStatusEnum.getOptions()));
const statusFilter = computed({
  get: () => toStringPickerValue(paging.condition.status),
  set: (value: string | number | boolean | null) => {
    paging.condition.status = resolveStringPickerFilter(value);
    refreshData();
  },
});
const selectedColumnProps = ref<string[]>([]);
const selectedGroupColumns = ref<string[]>([]);
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (row: Row) => void }>();
const groupRef = ref<{ show: (row?: GroupRow) => void }>();
const toolbarRow = {
  record: { id: "", status: MemberStatus.ACTIVE, departments: [] },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies Row;

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const visibleGroupHeaders = computed(() =>
  applyColumnSelection(groupHeaders, selectedGroupColumns.value),
);
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
const handleGroupCreate = (): void => {
  groupRef.value?.show();
};
const handleGroupDetail = (item: GroupRow): void => {
  groupRef.value?.show(item);
};
const handleGroupDelete = (item: GroupRow): void => {
  Confirm.error(`被引用的组不能静默级联撤权。是否删除（${item.record.name}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    PlatformGroupDeleteAPI(item.record.id).then(() => {
      Message.success("已删除");
      refreshGroups();
    });
  });
};

const toolbarActions = computed(() => createToolbarActions(handleCreate));
const groupToolbarActions = computed(() => createGroupToolbarActions(handleGroupCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, {
    onDetail: handleDetail,
    onSuspend: handleSuspend,
    onRestore: handleRestore,
    onRemove: handleRemove,
  });
const groupRowActionsOf = (item: GroupRow): Array<InTableAction<GroupRow>> =>
  createGroupRowActions(item, { onDetail: handleGroupDetail, onDelete: handleGroupDelete });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const privateOnGroupColumnChange = (value: string[]): void => {
  selectedGroupColumns.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
const groupKeyOf = (row: GroupRow): string => row.record.id;
</script>
