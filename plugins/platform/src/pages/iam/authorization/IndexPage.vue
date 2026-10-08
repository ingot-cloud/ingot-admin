<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="角色、角色分配与授权管理员。配置资格独立于本人业务权限。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel v-if="hasAction(IamAction.PLATFORM_ROLE_READ)" title="角色" name="roles">
          <role-workspace
            ref="roleWorkspaceRef"
            :active="tab === 'roles'"
            :rows="roles.pageInfo.value.records || []"
            :loading="roles.fetching.value"
            :page="roles.pageInfo.value"
            v-model:name="roles.condition.name"
            :toolbar-actions="roleToolbarActions"
            :row-actions="roleRowActionsOf"
            @search="refreshRoles"
            @page="roles.fetchData({ type: 'current', value: $event })"
            @assignment="handleAssignmentEdit"
            @revoke="handleAssignmentDelete"
            @upgrade="upgradeRef?.open($event)"
          />
        </in-biz-tab-panel>
        <in-biz-tab-panel
          v-if="hasAction(IamAction.PLATFORM_ASSIGNMENT_READ)"
          title="角色分配"
          name="assignments"
        >
          <in-table
            ref="assignmentTableRef"
            class="assignment-table"
            :tree-column="canUpgradeAssignments ? 'subject' : ''"
            :checkbox="assignments.fetching.value ? 'disabled' : assignmentCheckboxModeOf"
            :header-checkbox="assignments.fetching.value ? 'disabled' : true"
            :tree-expand="false"
            :loading="assignments.fetching.value"
            :data="assignments.pageInfo.value.records"
            :page="assignments.pageInfo.value"
            :headers="visibleAssignmentHeaders"
            :table-id="ASSIGNMENT_TABLE_ID"
            @selection-change="selectedUpgrades = $event"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="handleAssignmentPageChange"
            @handleCurrentChange="handleAssignmentPageChange"
          >
            <template #tools-start>
              <el-input
                v-model="assignments.condition.keyword"
                class="w-220px!"
                clearable
                placeholder="搜索授权成员或用户组"
                :prefix-icon="Search"
                @keyup.enter="refreshAssignments"
                @clear="refreshAssignments"
              />
              <in-picker
                v-model="assignmentSubjectTypeFilter"
                label="接收对象"
                :options="assignmentSubjectTypeOptions"
              />
              <in-picker
                v-model="assignmentStatusFilter"
                label="状态"
                :options="assignmentStatusOptions"
              />
              <in-table-column-setting
                :headers="assignmentHeaders"
                :table-id="ASSIGNMENT_TABLE_ID"
                @change="selectedAssignmentColumns = $event"
              />
            </template>
            <template #tools-end>
              <in-table-actions
                variant="toolbar"
                :actions="assignmentToolbarActions"
                :selected-count="selectedUpgrades.length"
                :row="emptyAssignmentRow"
              />
            </template>
            <template #subject-header>
              <span class="whitespace-nowrap">
                主体<span v-if="selectedUpgrades.length">
                  · 已选 {{ selectedUpgrades.length }} 条</span
                >
              </span>
            </template>
            <template #subject="{ item }">
              {{ subjectLabel(item.record.assignment.subject.type) }} /
              {{ item.record.subjectName || item.record.assignment.subject.id }}
            </template>
            <template #roleRevision="{ item }">
              {{ item.record.roleName || item.record.assignment.roleRevisionRef.id }} · v{{
                item.record.revisionNumber || "-"
              }}
            </template>
            <template #source="{ item }">{{
              item.record.delegationSummary || sourceLabel(item.record.source)
            }}</template>
            <template #createdAt="{ item }">{{
              formatDateTime(item.record.createdAt, { fallback: "-" })
            }}</template>
            <template #grantedBy="{ item }">{{ item.record.grantedBy?.name || "未知" }}</template>
            <template #validFrom="{ item }">{{
              localInstant(item.record.assignment.validFrom)
            }}</template>
            <template #status="{ item }">
              <status-tag
                :tone="item.record.effectiveStatus === 'ACTIVE' ? 'info' : 'warning'"
                :label="effectiveLabel(item.record.effectiveStatus)"
              />
            </template>
            <template #validUntil="{ item }">
              {{ localInstant(item.record.assignment.validUntil) }}
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="assignmentRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel
          v-if="hasAction(IamAction.PLATFORM_DELEGATION_READ)"
          title="授权管理员"
          name="delegations"
        >
          <in-table
            :loading="delegations.fetching.value"
            :data="delegations.pageInfo.value.records"
            :page="delegations.pageInfo.value"
            :headers="visibleDelegationHeaders"
            :table-id="DELEGATION_TABLE_ID"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="delegations.fetchData"
            @handleCurrentChange="delegations.fetchData"
          >
            <template #tools-start>
              <el-input
                v-model="delegations.condition.administratorName"
                class="w-220px!"
                clearable
                placeholder="搜索管理员名称"
                :prefix-icon="Search"
                @keyup.enter="refreshDelegations"
                @clear="refreshDelegations"
              />
              <in-table-column-setting
                :headers="delegationHeaders"
                :table-id="DELEGATION_TABLE_ID"
                @change="selectedDelegationColumns = $event"
              />
            </template>
            <template #tools-end>
              <in-table-actions
                variant="toolbar"
                :actions="delegationToolbarActions"
                :row="emptyDelegationRow"
              />
            </template>
            <template #administratorMemberId="{ item }">
              {{ item.record.administratorName || item.record.delegation.administratorMemberId }}
            </template>
            <template #status="{ item }">
              <status-tag
                :tone="item.record.status === 'ACTIVE' ? 'info' : 'warning'"
                :label="effectiveLabel(item.record.status)"
              />
            </template>
            <template #maxAssignmentDuration="{ item }">
              {{
                item.record.delegation.assignmentDurationMode === "UNLIMITED"
                  ? "不限期限"
                  : formatDuration(item.record.delegation.maxAssignmentDuration)
              }}
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="delegationRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>

  <create-wizard
    ref="createRef"
    title="创建平台角色"
    :kind="RoleKind.PLATFORM_CUSTOM"
    :create-api="PlatformRoleCreateAPI"
    @success="refreshRoles"
  />
  <shared-role-detail-drawer
    ref="detailRef"
    :get-api="PlatformRoleDetailAPI"
    :list-grants-api="PlatformRoleGrantsAPI"
    :list-revisions-api="PlatformRoleRevisionPageAPI"
    :update-api="PlatformRoleUpdateAPI"
    :status-api="PlatformRoleStatusAPI"
    :publish-api="PlatformRolePublishAPI"
    :grant-domain="AuthorizationDomain.PLATFORM"
    :status-action="IamAction.PLATFORM_ROLE_STATUS"
    :publish-action="IamAction.PLATFORM_ROLE_PUBLISH"
    @success="refreshRoles"
  />
  <biz-iam-platform-assignment-drawer
    ref="assignmentRef"
    :candidates-api="PlatformAssignmentCandidatesAPI"
    :role-candidates-api="PlatformAssignmentRoleCandidatesAPI"
    :context-api="PlatformAssignmentContextAPI"
    :get-api="PlatformAssignmentDetailAPI"
    :selected-candidates-api="PlatformAssignmentSelectedCandidatesAPI"
    :create-api="PlatformAssignmentCreateAPI"
    :preview-api="PlatformAssignmentPreviewAPI"
    :update-preview-api="PlatformAssignmentUpdatePreviewAPI"
    :update-api="PlatformAssignmentUpdateAPI"
    @success="refreshAssignmentViews"
  />
  <biz-iam-assignment-upgrade-drawer
    ref="upgradeRef"
    :role-candidates-api="upgradeRoles"
    :candidates-api="upgradeCandidates"
    :preview-api="AssignmentUpgradePreviewAPI"
    :save-api="AssignmentUpgradeAPI"
    @success="refreshAssignmentViews"
  />
  <biz-iam-platform-delegation-drawer
    ref="delegationRef"
    :candidates-api="PlatformDelegationCandidatesAPI"
    :role-candidates-api="PlatformDelegationRoleCandidatesAPI"
    :selected-candidates-api="PlatformDelegationSelectedCandidatesAPI"
    :create-api="PlatformDelegationCreateAPI"
    :get-api="PlatformDelegationDetailAPI"
    :update-api="PlatformDelegationUpdateAPI"
    :preview-api="PlatformDelegationPreviewAPI"
    :create-preview-api="PlatformDelegationCreatePreviewAPI"
    @success="refreshDelegations"
  />
  <biz-iam-platform-diagnose-drawer
    ref="diagnoseRef"
    :candidates-api="PlatformDiagnoseCandidatesAPI"
    :diagnose-api="PlatformDiagnoseAPI"
    @open-assignment="openAssignment"
  />
</template>

<script lang="ts" setup>
import { formatDateTime } from "@ingot/shared";
import { Search } from "@element-plus/icons-vue";
import {
  AssignmentSourceExtArray,
  AssignmentEffectiveStatus,
  AssignmentEffectiveStatusExtArray,
  AuthorizationDomain,
  BizIamPlatformAssignmentDrawer,
  BizIamAssignmentUpgradeDrawer,
  BizIamPlatformDelegationDrawer,
  BizIamPlatformDiagnoseDrawer,
  formatDuration,
  IamAction,
  RoleKind,
  SubjectType,
  SubjectTypeExtArray,
  useSubjectTypeEnum,
  useAssignmentEffectiveStatusEnum,
  iamEnumLabel,
  objectActionAllowed,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  applyColumnSelection,
  Confirm,
  Message,
  resolveStringPickerFilter,
  StatusTag,
  toStringPickerValue,
  type InTableAction,
  type InTableCheckboxMode,
  type TableAPI,
  useCapabilities,
  withAllPickerOption,
} from "@ingot/admin-core";
import {
  PlatformAssignmentCreateAPI,
  PlatformAssignmentCandidatesAPI,
  PlatformAssignmentRoleCandidatesAPI,
  PlatformAssignmentContextAPI,
  PlatformAssignmentDetailAPI,
  PlatformAssignmentSelectedCandidatesAPI,
  PlatformAssignmentUpdatePreviewAPI,
  PlatformDelegationCandidatesAPI,
  PlatformDelegationSelectedCandidatesAPI,
  PlatformDelegationRoleCandidatesAPI,
  PlatformDelegationCreatePreviewAPI,
  PlatformDiagnoseCandidatesAPI,
  PlatformAssignmentDeleteAPI,
  PlatformAssignmentPreviewAPI,
  PlatformAssignmentUpdateAPI,
  PlatformDelegationCreateAPI,
  PlatformDelegationDeleteAPI,
  PlatformDelegationDetailAPI,
  PlatformDelegationPreviewAPI,
  PlatformDelegationUpdateAPI,
  PlatformDiagnoseAPI,
  PlatformRoleCreateAPI,
  PlatformRoleDeleteAPI,
  PlatformRoleDetailAPI,
  PlatformRoleGrantsAPI,
  PlatformRolePublishAPI,
  PlatformRoleRevisionPageAPI,
  PlatformRoleStatusAPI,
  PlatformRoleUpdateAPI,
} from "@/api/iam/authorization";
import CreateWizard from "../shared-roles/components/CreateWizard.vue";
import SharedRoleDetailDrawer from "../shared-roles/components/SharedRoleDetailDrawer.vue";
import {
  ASSIGNMENT_TABLE_ID,
  assignmentHeaders,
  createAssignmentRowActions,
  createAssignmentToolbarActions,
  createDelegationRowActions,
  createDelegationToolbarActions,
  createRoleRowActions,
  createRoleToolbarActions,
  DELEGATION_TABLE_ID,
  delegationHeaders,
  emptyAssignmentRow,
  emptyDelegationRow,
  type AssignmentRow,
  type DelegationRow,
  type RoleRow,
} from "./table";
import { useOps } from "./useOps";
import RoleWorkspace from "./RoleWorkspace.vue";
import {
  AssignmentUpgradePreviewAPI,
  AssignmentUpgradeAPI,
  AssignmentUpgradeRoleCandidatesAPI,
  AssignmentUpgradeCandidatesAPI,
} from "@/api/iam/resourceExtension";
const upgradeRoles =
  (id: string): import("@ingot/admin-common").AuthorizationRoleCandidatesApi =>
  (query) =>
    AssignmentUpgradeRoleCandidatesAPI(id, query);
const upgradeCandidates =
  (id: string): import("@ingot/admin-common").AuthorizationCandidatesApi =>
  (query) =>
    AssignmentUpgradeCandidatesAPI(id, query);
const upgradeRef = ref<InstanceType<typeof BizIamAssignmentUpgradeDrawer>>();
const selectedUpgrades = ref<AssignmentRow[]>([]);

const { hasAction, actionCodes, contextEpoch, unavailable } = useCapabilities();
const canUpgradeAssignments = computed(() => hasAction(IamAction.PLATFORM_ASSIGNMENT_UPGRADE));
const assignmentTableRef = ref<TableAPI<AssignmentRow>>();
const assignmentCheckboxModeOf = (row: AssignmentRow): InTableCheckboxMode =>
  !canUpgradeAssignments.value
    ? "off"
    : objectActionAllowed(row.capabilities, IamAction.PLATFORM_ASSIGNMENT_UPGRADE).allowed
      ? "on"
      : "disabled";
const route = useRoute();
const router = useRouter();
const tab = ref("");
const availableTabs = computed(() =>
  [
    { name: "roles", action: IamAction.PLATFORM_ROLE_READ },
    { name: "assignments", action: IamAction.PLATFORM_ASSIGNMENT_READ },
    { name: "delegations", action: IamAction.PLATFORM_DELEGATION_READ },
  ].filter((item) => hasAction(item.action)),
);
watch(
  actionCodes,
  () => {
    if (!availableTabs.value.some((item) => item.name === tab.value))
      tab.value = availableTabs.value[0]?.name || "";
  },
  { immediate: true },
);
const {
  roles,
  assignments,
  delegations,
  refreshRoles,
  refreshAssignments: refreshAssignmentList,
  refreshDelegations,
} = useOps(tab);
const clearAssignmentSelection = (): void => {
  selectedUpgrades.value = [];
  assignmentTableRef.value?.clearSelection();
};
const refreshAssignments = (): void => {
  clearAssignmentSelection();
  refreshAssignmentList();
};
const handleAssignmentPageChange = (change: Parameters<typeof assignments.fetchData>[0]): void => {
  clearAssignmentSelection();
  assignments.fetchData(change);
};
watch(
  [
    () => assignments.pageInfo.value.records,
    () => assignments.fetching.value,
    canUpgradeAssignments,
    contextEpoch,
    unavailable,
    tab,
  ],
  clearAssignmentSelection,
  { flush: "sync" },
);
const selectedAssignmentColumns = ref<string[]>([]);
const selectedDelegationColumns = ref<string[]>([]);
const visibleAssignmentHeaders = computed(() =>
  applyColumnSelection(assignmentHeaders, selectedAssignmentColumns.value),
);
const visibleDelegationHeaders = computed(() =>
  applyColumnSelection(delegationHeaders, selectedDelegationColumns.value),
);
const assignmentSubjectTypeOptions = withAllPickerOption(useSubjectTypeEnum().getOptions());
const assignmentStatusOptions = withAllPickerOption(
  useAssignmentEffectiveStatusEnum().getOptions(),
);
const assignmentStatusFilter = computed({
  get: () => toStringPickerValue(assignments.condition.effectiveStatus),
  set: (value: string | number | boolean | null) => {
    const selected = resolveStringPickerFilter(value);
    assignments.condition.effectiveStatus = Object.values(AssignmentEffectiveStatus).find(
      (status) => status === selected,
    );
    refreshAssignments();
  },
});
const assignmentSubjectTypeFilter = computed({
  get: () => toStringPickerValue(assignments.condition.subjectType),
  set: (value: string | number | boolean | null) => {
    const selected = resolveStringPickerFilter(value);
    assignments.condition.subjectType =
      selected === SubjectType.MEMBER || selected === SubjectType.GROUP ? selected : undefined;
    refreshAssignments();
  },
});
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (id: string) => void }>();
const assignmentRef = ref<{
  show: (row?: AssignmentRow, preset?: { memberId?: string; roleId?: string }) => void;
}>();
const roleWorkspaceRef = ref<InstanceType<typeof RoleWorkspace>>();
const refreshAssignmentViews = (): void => {
  refreshAssignments();
  roleWorkspaceRef.value?.refresh();
};
const delegationRef = ref<{ show: (row?: DelegationRow) => void }>();
const diagnoseRef = ref<{ show: (preset?: { memberId?: string; memberName?: string }) => void }>();

const subjectLabel = (value: string): string => iamEnumLabel(SubjectTypeExtArray, value);
const sourceLabel = (value: string): string => iamEnumLabel(AssignmentSourceExtArray, value);
const effectiveLabel = (state?: string): string =>
  AssignmentEffectiveStatusExtArray.find((item) => item.value === state)?.text ?? "未知";
const localInstant = (instant?: string): string => formatDateTime(instant, { fallback: "长期" });
const openAssignment = async (id: string): Promise<void> => {
  if (!hasAction(IamAction.PLATFORM_ASSIGNMENT_READ)) return;
  const response = await PlatformAssignmentDetailAPI(id);
  assignmentRef.value?.show(response.data);
};

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleDetail = (item: RoleRow): void => {
  detailRef.value?.show(item.record.id);
};
const handleRoleDelete = (item: RoleRow): void => {
  Confirm.error(`未引用角色才会删除。是否删除（${item.record.name || item.record.id}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    PlatformRoleDeleteAPI(item.record.id).then(() => {
      Message.success("已删除");
      refreshRoles();
    });
  });
};
const handleDiagnose = (preset?: { memberId?: string; memberName?: string }): void => {
  diagnoseRef.value?.show(preset);
};
const handleAssignmentCreate = (): void => {
  assignmentRef.value?.show();
};
const handleAssignmentEdit = (item: AssignmentRow): void => {
  assignmentRef.value?.show(item);
};
const handleAssignmentDelete = (item: AssignmentRow): void => {
  Confirm.error("撤销授权并保留审计，不会静默改写其它记录。是否撤销？", {
    confirmButtonText: "撤销",
  }).then(() => {
    PlatformAssignmentDeleteAPI(item.record.id).then(() => {
      Message.success("已撤销授权");
      refreshAssignmentViews();
    });
  });
};
const handleAssignmentDiagnose = (item: AssignmentRow): void => {
  handleDiagnose({
    memberId: item.record.assignment.subject.id,
    memberName: item.record.subjectName,
  });
};
const handleDelegationCreate = (): void => {
  delegationRef.value?.show();
};
const handleDelegationEdit = (item: DelegationRow): void => {
  delegationRef.value?.show(item);
};
const handleDelegationDelete = (item: DelegationRow): void => {
  Confirm.error("撤销后派生授权将失效。是否撤销该委派？", {
    confirmButtonText: "撤销",
  }).then(() => {
    PlatformDelegationDeleteAPI(item.record.id).then(() => {
      Message.success("已撤销委派");
      refreshDelegations();
    });
  });
};

const roleToolbarActions = computed(() =>
  createRoleToolbarActions(handleCreate, () => handleDiagnose()),
);
const roleRowActionsOf = (item: RoleRow): Array<InTableAction<RoleRow>> =>
  createRoleRowActions(item, { onDetail: handleDetail, onDelete: handleRoleDelete });
const assignmentToolbarActions = computed(() =>
  createAssignmentToolbarActions(handleAssignmentCreate, () => handleDiagnose(), {
    selectedCount: selectedUpgrades.value.length,
    onSelect: () => upgradeRef.value?.open(selectedUpgrades.value),
  }),
);
const assignmentRowActionsOf = (item: AssignmentRow): Array<InTableAction<AssignmentRow>> =>
  createAssignmentRowActions(item, {
    onEdit: handleAssignmentEdit,
    onUpgrade: (row) => upgradeRef.value?.open([row]),
    onDelete: handleAssignmentDelete,
    onDiagnose: handleAssignmentDiagnose,
  });
const delegationToolbarActions = computed(() =>
  createDelegationToolbarActions(handleDelegationCreate),
);
const delegationRowActionsOf = (item: DelegationRow): Array<InTableAction<DelegationRow>> =>
  createDelegationRowActions(item, {
    onEdit: handleDelegationEdit,
    onDelete: handleDelegationDelete,
  });
const rowKeyOf = (row: ResourceDetail<{ id: string }>): string => row.record.id;
watch(
  () => [route.query.assignmentMemberId, actionCodes.value, assignmentRef.value] as const,
  async () => {
    const memberId = route.query.assignmentMemberId;
    if (
      typeof memberId !== "string" ||
      !assignmentRef.value ||
      !hasAction(IamAction.PLATFORM_ASSIGNMENT_CREATE)
    )
      return;
    tab.value = "assignments";
    assignmentRef.value.show(undefined, { memberId });
    const query = { ...route.query };
    delete query.assignmentMemberId;
    await router.replace({ query });
  },
  { immediate: true },
);
</script>

<style lang="postcss" scoped>
:deep(.assignment-table .in-table-tree-expand-spacer) {
  display: none;
}
</style>
