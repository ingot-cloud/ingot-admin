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
      <template #error>
        <div class="flex flex-col items-center gap-12px">
          <span>暂时无法加载成员字段权限</span>
          <in-button @in-click="refreshContext">重试</in-button>
        </div>
      </template>
      <template #title>
        <span>{{ selectedDetail?.record.name || "用户组" }}</span>
        <span class="in-table__count">共 {{ memberTotal }} 人</span>
      </template>
      <template #tools-start>
        <el-input
          v-if="canSearchName"
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
            v-if="!fieldHidden('avatar')"
            :src="item.member.avatar"
            :name="item.member.displayName || item.member.id"
            :show-name="false"
          />
          <span>{{ item.member.displayName || "-" }}</span>
        </div>
      </template>
      <template #status="{ item }">
        <status-tag
          v-if="memberStatusTone(item.member.status)"
          :tone="statusToneOf(item.member.status)"
          :label="memberStatusEnum.getTagText(item.member.status).text"
        />
        <span v-else>-</span>
      </template>
      <template #phone="{ item }">
        <span>{{ item.member.phone || "-" }}</span>
      </template>
      <template #departments="{ item }">
        <span>{{ formatVisibleDepartments(item.member.departments) }}</span>
      </template>
      <template #membership="{ item }">
        <span>{{ formatMembershipSources(item.membership) }}</span>
      </template>
      <template #actions="{ item }">
        <in-button
          v-if="canRemoveDirectMembership(item.membership)"
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

  <group-wizard ref="wizardRef" @success="handleEditSuccess" />
  <group-detail-drawer ref="detailRef" @edit="handleGroupEdit" @delete="handleGroupDelete" />
  <biz-iam-member-picker-dialog
    ref="pickerRef"
    organization
    :load-members="TenantMemberPickerLoad"
    :load-bound="loadBoundMembers"
    :load-browse="loadBrowse"
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
  FieldVisibility,
  IamAction,
  MemberStatus,
  OrganizationMemberScene,
  type OrganizationMemberBrowseParams,
  isFieldFilterable,
  memberStatusTone,
  useFieldContext,
  useMemberStatusEnum,
  type MemberPickerChanges,
} from "@ingot/admin-common";
import {
  TenantGroupBoundMembersLoad,
  TenantGroupDeleteAPI,
  TenantMemberContextAPI,
  TenantMemberPickerLoad,
  TenantOrganizationMemberBrowseAPI,
} from "@/api/iam/directory";
import GroupDetailDrawer from "./GroupDetailDrawer.vue";
import GroupList from "./GroupList.vue";
import GroupWizard from "./GroupWizard.vue";
import {
  canRemoveDirectMembership,
  formatMembershipSources,
  formatVisibleDepartments,
} from "../membership";
import {
  createMemberToolbarActions,
  GROUP_MEMBER_TABLE_ID,
  GROUP_SPLIT_KEY,
  tableHeaders,
  type GroupMemberRow,
  type GroupRow,
} from "../table";
import { useOps } from "../useOps";

defineOptions({ name: "GroupWorkspace" });

const FIELD_HEADER_PROPS = new Set(["displayName", "phone"]);
const { context, contextLoading, contextError, refreshContext } = useFieldContext(
  IamAction.TENANT_MEMBER_READ,
  TenantMemberContextAPI,
  computed(() => true),
);
const {
  groupPaging,
  memberPaging,
  selectedId,
  selectedDetail,
  saving,
  updateAccess,
  selectGroup,
  refreshGroups,
  reloadSelected,
  ensureSelectedDetail,
  addMembers,
  removeMember,
} = useOps();

const { unavailable, hasAction } = useCapabilities();
const memberStatusEnum = useMemberStatusEnum();
const selectedColumns = ref<string[]>([]);
const wizardRef = ref<{ show: (row?: GroupRow) => void }>();
const detailRef = ref<{ show: (row: GroupRow) => void; hide: () => void }>();
const pickerRef = ref<{ show: (current?: { boundIds: string[]; partial?: boolean }) => void }>();
const toolbarRow = {
  member: { id: "", status: MemberStatus.ACTIVE, departments: [] },
  membership: { direct: false, departments: [] },
} satisfies GroupMemberRow;

const loadBoundMembers = (params: LoadDataParams) =>
  TenantGroupBoundMembersLoad(selectedId.value, params);
const loadBrowse = async (params: OrganizationMemberBrowseParams) => {
  const response = await TenantOrganizationMemberBrowseAPI({
    ...params,
    scene: OrganizationMemberScene.MEMBER,
  });
  return response.data;
};

const canCreate = computed(() => hasAction(IamAction.TENANT_GROUP_CREATE));
const canSearchName = computed(() =>
  isFieldFilterable(context.value?.fieldOperations, IamAction.TENANT_MEMBER_READ, "displayName"),
);
const fieldHidden = (key: string): boolean =>
  context.value?.fieldVisibility[key] === FieldVisibility.HIDDEN;
const permissionHeaders = computed(() =>
  tableHeaders.filter((header) => !header.prop || !FIELD_HEADER_PROPS.has(header.prop) || !fieldHidden(header.prop)),
);
const visibleHeaders = computed(() =>
  applyColumnSelection(permissionHeaders.value, selectedColumns.value),
);
watch(canSearchName, (allowed) => {
  if (!allowed) {
    memberPaging.condition.name = undefined;
  }
});
const memberTotal = computed(() => memberPaging.pageInfo.value.total ?? 0);
const memberFeedback = computed<InTableFeedback>(() =>
  unavailable.value || contextError.value ? "error" : "empty",
);
const memberToolbarActions = computed(() =>
  createMemberToolbarActions(handleAdd, updateAccess.value.allowed, updateAccess.value.message),
);
const statusToneOf = (status: string): "info" | "warning" | "danger" =>
  memberStatusTone(status) ?? "info";

const handleEditSuccess = (): void => {
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
    TenantGroupDeleteAPI(row.record.id).then(() => {
      Message.success("已删除");
      detailRef.value?.hide();
      refreshGroups();
    });
  });
};
const handleAdd = (): void => {
  void ensureSelectedDetail().then((current) => {
    if (!current) {
      return;
    }
    pickerRef.value?.show({
      boundIds: current.record.selection.members,
      partial: true,
    });
  });
};
const handlePicked = (
  _members: unknown,
  _primary?: string,
  changes?: MemberPickerChanges,
): void => {
  if (!changes) {
    return;
  }
  void addMembers(changes);
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
const memberKeyOf = (row: GroupMemberRow): string => row.member.id;
</script>
