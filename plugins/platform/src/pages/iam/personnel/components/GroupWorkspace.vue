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
        :records="groupPaging.pageInfo.value.records ?? []"
        :selected-id="selectedId"
        :loading="groupPaging.fetching.value"
        :current="groupPaging.pageInfo.value.current ?? 1"
        :size="groupPaging.pageInfo.value.size ?? 20"
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
      v-if="canReadMembers"
      :loading="memberPaging.fetching.value || contextLoading || saving"
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
      <template #error
        ><div class="flex flex-col items-center gap-12px">
          <span>暂时无法加载成员字段权限</span
          ><in-button @in-click="refreshContext">重试</in-button>
        </div></template
      >
      <template #title>
        <span>{{ selectedGroup?.record.name || "用户组" }}</span>
        <span class="in-table__count">共 {{ memberTotal }} 人</span>
      </template>
      <template #tools-start>
        <el-input
          v-if="context?.canSearchDisplayName"
          v-model="memberPaging.condition.name"
          class="w-200px!"
          clearable
          placeholder="搜索成员"
          :prefix-icon="Search"
          :disabled="!selectedGroup"
          @keyup.enter="refreshMembers"
          @clear="refreshMembers"
        />
        <in-table-column-setting
          :headers="permissionHeaders"
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
            v-if="memberFieldVisible(item.fieldAccess, 'avatar')"
            :src="item.record.avatar"
            :name="item.record.displayName || item.record.username"
            :show-name="false"
          />
          <span v-if="memberFieldVisible(item.fieldAccess, 'displayName')">{{
            item.record.displayName || "-"
          }}</span>
        </div>
      </template>
      <template #phone="{ item }"
        ><span v-if="memberFieldVisible(item.fieldAccess, 'phone')">{{
          item.record.phone || "-"
        }}</span></template
      >
      <template #email="{ item }"
        ><span v-if="memberFieldVisible(item.fieldAccess, 'email')">{{
          item.record.email || "-"
        }}</span></template
      >
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
  <group-detail-drawer ref="detailRef" @edit="handleGroupEdit" @delete="handleGroupDelete" />
  <biz-iam-member-picker-dialog
    ref="pickerRef"
    :load-members="loadPlatformMemberOptions"
    :load-bound="loadBoundMembers"
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
  type LoadDataParams,
} from "@ingot/admin-core";
import {
  BizIamMemberPickerDialog,
  IamAction,
  MemberStatus,
  memberStatusTone,
  useMemberStatusEnum,
  type MemberPickerChanges,
} from "@ingot/admin-common";
import { PlatformGroupDeleteAPI } from "@/api/iam/personnel";
import GroupDetailDrawer from "./GroupDetailDrawer.vue";
import GroupList from "./GroupList.vue";
import GroupWizard from "./GroupWizard.vue";
import type { GroupRow, GroupSummaryRow } from "../groupTable";
import {
  createGroupMemberToolbarActions,
  GROUP_MEMBER_TABLE_ID,
  GROUP_SPLIT_KEY,
  groupMemberHeaders,
  type GroupMemberRow,
} from "../groupMembersTable";
import { loadPlatformGroupBoundMembers, loadPlatformMemberOptions } from "../iamMemberOptions";
import { useGroupOps } from "../useGroupOps";
import { useMemberFieldContext } from "../useMemberFieldContext";
import { memberFieldVisible, memberPermissionHeaders } from "../memberFieldAccess";

defineOptions({ name: "GroupWorkspace" });
const props = withDefaults(defineProps<{ active?: boolean }>(), { active: true });
const { unavailable, hasAction } = useCapabilities();
const canReadMembers = computed(() => hasAction(IamAction.PLATFORM_MEMBER_READ));
const active = computed(() => props.active && hasAction(IamAction.PLATFORM_GROUP_READ));
const { context, contextLoading, contextError, refreshContext } = useMemberFieldContext(
  computed(() => active.value && canReadMembers.value),
);

const {
  groupPaging,
  memberPaging,
  selectedId,
  selectedGroup,
  saving,
  updateAccess,
  prepareMemberPicker,
  selectGroup,
  refreshGroups,
  reloadSelected,
  removeMember,
  addMembers,
} = useGroupOps(active);
const memberStatusEnum = useMemberStatusEnum();
const selectedColumns = ref<string[]>([]);
const wizardRef = ref<{ show: (row?: GroupRow) => void }>();
const detailRef = ref<{ show: (id: string) => void; hide: () => void }>();
const pickerRef = ref<{ show: (current?: { boundIds: string[]; partial: boolean }) => void }>();
const toolbarRow = {
  record: { id: "", status: MemberStatus.ACTIVE, departments: [] },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies GroupMemberRow;

const loadBoundMembers = (params: LoadDataParams) =>
  loadPlatformGroupBoundMembers(selectedId.value, params);

const canCreate = computed(() => hasAction(IamAction.PLATFORM_GROUP_CREATE));
const permissionHeaders = computed(() =>
  memberPermissionHeaders(groupMemberHeaders, context.value),
);
const visibleHeaders = computed(() =>
  applyColumnSelection(permissionHeaders.value, selectedColumns.value),
);
watch(context, (value) => {
  if (value && !value.canSearchDisplayName) memberPaging.condition.name = undefined;
});
const memberTotal = computed(
  () => memberPaging.pageInfo.value.total ?? 0,
);
const memberFeedback = computed<InTableFeedback>(() =>
  unavailable.value || contextError.value ? "error" : "empty",
);
const memberToolbarActions = computed(() =>
  createGroupMemberToolbarActions(
    handleAdd,
    updateAccess.value.allowed,
    updateAccess.value.message,
  ),
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
const handleGroupDetail = (row: GroupSummaryRow): void => {
  selectGroup(row);
  detailRef.value?.show(row.record.id);
};
const handleGroupEdit = (row: GroupRow): void => {
  wizardRef.value?.show(row);
};
const handleGroupDelete = (row: GroupSummaryRow): void => {
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
  void prepareMemberPicker().then((current) => {
    if (current) pickerRef.value?.show({ boundIds: current.record.selection.members, partial: true });
  }).catch(() => undefined);
};
const handlePicked = (_members: unknown, _primary?: string, changes?: MemberPickerChanges): void => {
  if (changes) void addMembers(changes).catch(() => undefined);
};
const handleRemove = (item: GroupMemberRow): void => {
  void removeMember(item).catch(() => undefined);
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
