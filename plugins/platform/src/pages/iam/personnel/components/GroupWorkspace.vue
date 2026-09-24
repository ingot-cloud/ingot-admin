<template>
  <in-split-layout
    left-collapsible
    :auto-collapse="false"
    :left-width="240"
    :persistence-key="GROUP_SPLIT_KEY"
  >
    <template #left>
      <group-list
        v-model:name="groupPaging.condition.name"
        :records="groupPaging.pageInfo.value.records"
        :selected-id="selectedId"
        :loading="groupPaging.fetching.value"
        :current="groupPaging.pageInfo.value.current"
        :size="groupPaging.pageInfo.value.size"
        :total="groupPaging.pageInfo.value.total ?? 0"
        :can-create="canCreate"
        @search="refreshGroups"
        @select="selectGroup"
        @detail="handleGroupDetail"
        @delete="handleGroupDelete"
        @create="handleCreate"
        @page="privateOnGroupPage"
      />
    </template>
    <in-table
      :loading="memberPaging.fetching.value || saving"
      :data="memberPaging.pageInfo.value.records"
      :page="memberPaging.pageInfo.value"
      :headers="visibleHeaders"
      :table-id="GROUP_MEMBER_TABLE_ID"
      :feedback="memberFeedback"
      density="compact"
      :row-key="memberKeyOf"
      @handleSizeChange="memberPaging.fetchData"
      @handleCurrentChange="memberPaging.fetchData"
    >
      <template #title>
        <span>{{ selectedDetail?.record.name || "用户组" }}</span>
        <span class="in-table__count">共 {{ memberTotal }} 人</span>
      </template>
      <template #tools-start>
        <el-input
          v-model="memberPaging.condition.name"
          class="w-200px!"
          clearable
          placeholder="搜索成员"
          :prefix-icon="Search"
          :disabled="!selectedDetail"
          @keyup.enter="refreshMembers"
          @clear="refreshMembers"
        />
        <in-table-column-setting
          :headers="groupMemberHeaders"
          :table-id="GROUP_MEMBER_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="memberToolbarActions" :row="toolbarRow" />
      </template>
      <template #displayName="{ item }">
        <div class="flex items-center gap-8px">
          <in-avatar
            :src="item.record.avatar"
            :name="item.record.displayName || item.record.username"
            :show-name="false"
          />
          <span>{{ item.record.displayName || item.record.id }}</span>
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
        <span v-else>-</span>
      </template>
      <template #actions="{ item }">
        <in-button
          link
          type="danger"
          :disabled="!updateAccess.allowed"
          @in-click="handleRemove(item)"
        >
          移出
        </in-button>
      </template>
    </in-table>
  </in-split-layout>

  <group-wizard ref="wizardRef" @success="handleWizardSuccess" />
  <group-detail-drawer
    ref="detailRef"
    @edit="handleGroupEdit"
    @delete="handleGroupDelete"
  />
  <biz-iam-member-picker-dialog
    ref="pickerRef"
    :load-members="loadPlatformMemberOptions"
    @confirm="handlePicked"
  />
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  Confirm,
  Message,
  StatusTag,
  useCapabilities,
  type InTableFeedback,
} from "@ingot/admin-core";
import {
  BizIamMemberPickerDialog,
  IamAction,
  MemberStatus,
  memberStatusTone,
  useMemberStatusEnum,
  type IamSelectOption,
} from "@ingot/admin-common";
import { PlatformGroupDeleteAPI } from "@/api/iam/personnel";
import GroupDetailDrawer from "./GroupDetailDrawer.vue";
import GroupList from "./GroupList.vue";
import GroupWizard from "./GroupWizard.vue";
import type { GroupRow } from "../groupTable";
import {
  createGroupMemberToolbarActions,
  GROUP_MEMBER_TABLE_ID,
  GROUP_SPLIT_KEY,
  groupMemberHeaders,
  type GroupMemberRow,
} from "../groupMembersTable";
import { loadPlatformMemberOptions, loadPlatformMembersByIds } from "../iamMemberOptions";
import { useGroupOps } from "../useGroupOps";

defineOptions({ name: "GroupWorkspace" });

const {
  groupPaging,
  memberPaging,
  selectedId,
  selectedDetail,
  saving,
  updateAccess,
  memberIds,
  selectGroup,
  refreshGroups,
  reloadSelected,
  removeMember,
  addMembers,
} = useGroupOps();

const { unavailable, hasAction } = useCapabilities();
const memberStatusEnum = useMemberStatusEnum();
const selectedColumns = ref<string[]>([]);
const wizardRef = ref<{ show: (row?: GroupRow) => void }>();
const detailRef = ref<{ show: (row: GroupRow) => void; hide: () => void }>();
const pickerRef = ref<{ show: (current: IamSelectOption[]) => void }>();
const toolbarRow = {
  record: { id: "", status: MemberStatus.ACTIVE, departments: [] },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies GroupMemberRow;

const canCreate = computed(() => hasAction(IamAction.PLATFORM_GROUP_CREATE));
const visibleHeaders = computed(() => applyColumnSelection(groupMemberHeaders, selectedColumns.value));
const memberTotal = computed(
  () => memberPaging.pageInfo.value.total ?? selectedDetail.value?.record.visibleMemberCount ?? 0,
);
const memberFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));
const memberToolbarActions = computed(() =>
  createGroupMemberToolbarActions(handleAdd, updateAccess.value.allowed, updateAccess.value.message),
);

const statusToneOf = (status: string): "info" | "warning" | "danger" =>
  memberStatusTone(status) ?? "info";

const handleWizardSuccess = (): void => {
  refreshGroups();
  reloadSelected();
};
const handleCreate = (): void => {
  wizardRef.value?.show();
};
const handleGroupDetail = (row: GroupRow): void => {
  selectGroup(row);
  detailRef.value?.show(row);
};
const handleGroupEdit = (row: GroupRow): void => {
  wizardRef.value?.show(row);
};
const handleGroupDelete = (row: GroupRow): void => {
  Confirm.error(`被引用的组不能静默级联撤权。是否删除（${row.record.name}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    PlatformGroupDeleteAPI(row.record.id).then(() => {
      Message.success("已删除");
      detailRef.value?.hide();
      refreshGroups();
    });
  });
};
const handleAdd = (): void => {
  if (!selectedDetail.value) {
    return;
  }
  void loadPlatformMembersByIds(memberIds.value).then((current) => {
    pickerRef.value?.show(current);
  });
};
const handlePicked = (members: IamSelectOption[]): void => {
  void addMembers(members);
};
const handleRemove = (item: GroupMemberRow): void => {
  void removeMember(item);
};
const refreshMembers = (): void => {
  memberPaging.search();
};
const privateOnGroupPage = (current: number): void => {
  groupPaging.fetchData({ type: "current", value: current });
};
const privateOnColumnChange = (value: string[]): void => {
  selectedColumns.value = value;
};
const memberKeyOf = (row: GroupMemberRow): string => row.record.id;
</script>
