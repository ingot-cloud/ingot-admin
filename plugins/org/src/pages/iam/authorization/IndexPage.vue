<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header
        description="管理组织角色、授权记录和授权管理员。角色按名称识别，修改权限后关联人员自动生效。"
      />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel v-if="hasAction(IamAction.TENANT_ROLE_READ)" title="角色" name="roles">
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
          />
        </in-biz-tab-panel>
        <in-biz-tab-panel
          v-if="hasAction(IamAction.TENANT_ASSIGNMENT_READ)"
          title="授权记录"
          name="assignments"
        >
          <in-table
            :loading="assignments.fetching.value"
            :data="assignments.pageInfo.value.records"
            :page="assignments.pageInfo.value"
            :headers="visibleAssignmentHeaders"
            :table-id="ASSIGNMENT_TABLE_ID"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="assignments.fetchData"
            @handleCurrentChange="assignments.fetchData"
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
                :row="emptyAssignmentRow"
              />
            </template>
            <template #subject="{ item }">
              {{ subjectLabel(item.record.assignment.subject.type) }} /
              {{ item.record.subjectName || "未命名" }}
            </template>
            <template #role="{ item }">{{ item.record.roleName || "未命名角色" }}</template>
            <template #source="{ item }">{{
              item.record.assignment.delegationGrantId
                ? "授权管理员分配"
                : assignmentSource.getTagText(item.record.source).text
            }}</template>
            <template #status="{ item }">
              <status-tag
                :tone="item.record.effectiveStatus === AssignmentEffectiveStatus.ACTIVE ? 'info' : 'warning'"
                :label="effectiveStatus.getTagText(item.record.effectiveStatus).text"
              />
              <el-tag v-if="item.record.scopeIssues.length" class="ml-8px" type="warning">
                待补范围 {{ item.record.scopeIssues.length }}
              </el-tag>
            </template>
            <template #validFrom="{ item }">
              {{ formatDateTime(item.record.assignment.validFrom, { fallback: "-" }) }}
            </template>
            <template #validUntil="{ item }">
              {{ formatDateTime(item.record.assignment.validUntil, { fallback: "长期" }) }}
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="assignmentRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel
          v-if="hasAction(IamAction.TENANT_DELEGATION_READ)"
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
              {{ item.record.administratorName || "未命名管理员" }}
            </template>
            <template #status="{ item }">
              <status-tag
                :tone="item.record.status === GrantStatus.ACTIVE ? 'info' : 'warning'"
                :label="grantStatus.getTagText(item.record.status).text"
              />
            </template>
            <template #maxAssignmentDuration="{ item }">
              {{ formatDuration(item.record.delegation.maxAssignmentDuration) }}
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
    :catalog-a-p-i="TenantRoleGrantCatalogAPI"
    :application-candidates="applicationCandidates"
    @success="refreshRoles"
  />
  <role-detail-drawer
    ref="detailRef"
    :catalog-a-p-i="TenantRoleGrantCatalogAPI"
    :application-candidates="applicationCandidates"
    @success="refreshRoles"
  />
  <biz-iam-tenant-assignment-drawer
    ref="assignmentRef"
    :apis="assignmentApis"
    @success="refreshAssignmentViews"
  />
  <biz-iam-tenant-delegation-drawer
    ref="delegationRef"
    :apis="delegationApis"
    :assignment-apis="assignmentApis"
    :department-candidates="departmentCandidates"
    @success="refreshDelegations"
  />
  <biz-iam-diagnose-drawer
    ref="diagnoseRef"
    :load-members="loadMembers"
    :load-applications="loadApplications"
    :diagnose-api="TenantDiagnoseAPI"
  />
</template>

<script lang="ts" setup>
import { formatDateTime } from "@ingot/shared";
import { Search } from "@element-plus/icons-vue";
import {
  AssignmentEffectiveStatus,
  GrantStatus,
  IamAction,
  SubjectType,
  SubjectTypeExtArray,
  formatDuration,
  iamEnumLabel,
  useAssignmentSourceEnum,
  useAssignmentEffectiveStatusEnum,
  useGrantStatusEnum,
  useSubjectTypeEnum,
  type AuthorizationCandidatesApi,
  type TenantAssignmentApis,
  type TenantDelegationApis,
  BizIamTenantAssignmentDrawer,
  BizIamTenantDelegationDrawer,
  BizIamDiagnoseDrawer,
  createIamListLoader,
  toIamSelectRecords,
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
  useCapabilities,
  withAllPickerOption,
} from "@ingot/admin-core";
import {
  TenantAssignmentCreateAPI,
  TenantAssignmentScopeCandidatesAPI,
  TenantAssignmentOptionsAPI,
  TenantAssignmentRoleDefinitionAPI,
  TenantDelegationMineAPI,
  TenantRoleDeleteAPI,
  TenantRoleGrantCatalogAPI,
  TenantDelegationScopeCandidatesAPI,
  TenantAssignmentDeleteAPI,
  TenantAssignmentPreviewAPI,
  TenantAssignmentUpdateAPI,
  TenantDelegationCreateAPI,
  TenantDelegationDeleteAPI,
  TenantDelegationDetailAPI,
  TenantDelegationPreviewAPI,
  TenantDelegationUpdateAPI,
  TenantDiagnoseAPI,
} from "@/api/iam/authorization";
import { TenantApplicationPageAPI, TenantMemberPickerLoad } from "@/api/iam/directory";
import CreateWizard from "./components/CreateWizard.vue";
import RoleDetailDrawer from "./components/RoleDetailDrawer.vue";
import RoleWorkspace from "./components/RoleWorkspace.vue";
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

const assignmentSource = useAssignmentSourceEnum();
const effectiveStatus = useAssignmentEffectiveStatusEnum();
const grantStatus = useGrantStatusEnum();
const { hasAction, actionCodes } = useCapabilities();
const tab = ref(hasAction(IamAction.TENANT_ROLE_READ) ? "roles" : "assignments");
watch(actionCodes, () => {
  if (tab.value === "roles" && !hasAction(IamAction.TENANT_ROLE_READ)) tab.value = "assignments";
});
const { roles, assignments, delegations, refreshRoles, refreshAssignments, refreshDelegations } =
  useOps(tab);
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (id: string) => void }>();
const roleWorkspaceRef = ref<InstanceType<typeof RoleWorkspace>>();
const assignmentRef = ref<{ show: (row?: AssignmentRow) => void }>();
const delegationRef = ref<{ show: (row?: DelegationRow) => void }>();
const diagnoseRef = ref<{ show: (preset?: { memberId?: string }) => void }>();
const selectedAssignmentColumns = ref<string[]>([]);
const selectedDelegationColumns = ref<string[]>([]);
const visibleAssignmentHeaders = computed(() =>
  applyColumnSelection(assignmentHeaders, selectedAssignmentColumns.value),
);
const visibleDelegationHeaders = computed(() =>
  applyColumnSelection(delegationHeaders, selectedDelegationColumns.value),
);
const assignmentSubjectTypeOptions = withAllPickerOption(useSubjectTypeEnum().getOptions());
const assignmentSubjectTypeFilter = computed({
  get: () => toStringPickerValue(assignments.condition.subjectType),
  set: (value: string | number | boolean | null) => {
    const selected = resolveStringPickerFilter(value);
    assignments.condition.subjectType =
      selected === SubjectType.MEMBER || selected === SubjectType.GROUP ? selected : undefined;
    refreshAssignments();
  },
});

const loadMembers = TenantMemberPickerLoad;
const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await TenantApplicationPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const assignmentApis: TenantAssignmentApis = {
  optionsAPI: TenantAssignmentOptionsAPI,
  roleAPI: TenantAssignmentRoleDefinitionAPI,
  mineAPI: TenantDelegationMineAPI,
  scopeAPI: TenantAssignmentScopeCandidatesAPI,
  createAPI: TenantAssignmentCreateAPI,
  previewAPI: TenantAssignmentPreviewAPI,
  updateAPI: TenantAssignmentUpdateAPI,
};
const delegationApis: TenantDelegationApis = {
  createAPI: TenantDelegationCreateAPI,
  detailAPI: TenantDelegationDetailAPI,
  updateAPI: TenantDelegationUpdateAPI,
  previewAPI: TenantDelegationPreviewAPI,
  scopeAPI: TenantDelegationScopeCandidatesAPI,
};
const candidateOf =
  (kind: "APPLICATION" | "DEPARTMENT"): AuthorizationCandidatesApi =>
  async (query) => {
    const response = await TenantAssignmentOptionsAPI({
      kind,
      keyword: query.keyword,
      ids: query.ids,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      ...response,
      data: { ...response.data, total: Number(response.data.total || 0), supported: true },
    };
  };
const applicationCandidates = candidateOf("APPLICATION");
const departmentCandidates = candidateOf("DEPARTMENT");
const subjectLabel = (value: string): string => iamEnumLabel(SubjectTypeExtArray, value);
const refreshAssignmentViews = (): void => {
  refreshAssignments();
  roleWorkspaceRef.value?.refresh();
};

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleDetail = (item: RoleRow): void => {
  detailRef.value?.show(item.record.id);
};
const handleRoleDelete = (item: RoleRow): void => {
  Confirm.error(`未引用角色才会删除。是否删除（${item.record.name || "未命名角色"}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    TenantRoleDeleteAPI(item.record.id).then(() => {
      Message.success("已删除");
      refreshRoles();
    });
  });
};
const handleDiagnose = (preset?: { memberId?: string }): void => {
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
    TenantAssignmentDeleteAPI(item.record.id).then(() => {
      Message.success("已撤销授权");
      refreshAssignmentViews();
    });
  });
};
const handleAssignmentDiagnose = (item: AssignmentRow): void => {
  handleDiagnose({ memberId: item.record.assignment.subject.id });
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
    TenantDelegationDeleteAPI(item.record.id).then(() => {
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
  createAssignmentToolbarActions(handleAssignmentCreate, () => handleDiagnose()),
);
const assignmentRowActionsOf = (item: AssignmentRow): Array<InTableAction<AssignmentRow>> =>
  createAssignmentRowActions(item, {
    onEdit: handleAssignmentEdit,
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
</script>
