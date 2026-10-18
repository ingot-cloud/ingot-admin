<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="角色、授权记录与授权管理员。诊断为工具入口，不提供模拟执行。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel
          v-if="hasAction(IamAction.TENANT_ROLE_READ)"
          title="角色"
          name="roles"
          fill
        >
          <in-table
            :loading="roles.fetching.value"
            :data="roles.pageInfo.value.records"
            :page="roles.pageInfo.value"
            :headers="roleHeaders"
            :table-id="ROLE_TABLE_ID"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="roles.fetchData"
            @handleCurrentChange="roles.fetchData"
          >
            <template #tools-end>
              <in-table-actions
                variant="toolbar"
                :actions="roleToolbarActions"
                :row="emptyRoleRow"
              />
            </template>
            <template #name="{ item }">
              <biz-iam-record-link
                :action="IamAction.TENANT_ROLE_READ"
                :capabilities="item.capabilities"
                @click="handleDetail(item)"
              >
                {{ item.record.name || item.record.id }}
              </biz-iam-record-link>
            </template>
            <template #kind="{ item }">{{
              item.record.kind === RoleKind.SHARED ? "平台共享" : "组织私有"
            }}</template>
            <template #status="{ item }">
              <biz-iam-status-tag :status="item.record.status" />
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="roleRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel
          v-if="hasAction(IamAction.TENANT_ASSIGNMENT_READ)"
          title="授权记录"
          name="assignments"
          fill
        >
          <in-table
            :loading="assignments.fetching.value"
            :data="assignments.pageInfo.value.records"
            :page="assignments.pageInfo.value"
            :headers="assignmentHeaders"
            table-id="org-iam-assignments"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="assignments.fetchData"
            @handleCurrentChange="assignments.fetchData"
          >
            <template #tools-end>
              <in-table-actions
                variant="toolbar"
                :actions="assignmentToolbarActions"
                :row="emptyAssignmentRow"
              />
            </template>
            <template #subject="{ item }">
              {{ item.record.subjectName || item.record.assignment.subject.id }}
            </template>
            <template #role="{ item }">
              {{ item.record.roleName || item.record.assignment.roleId }}
            </template>
            <template #source="{ item }">{{
              assignmentSource.getTagText(item.record.source).text
            }}</template>
            <template #status="{ item }"
              >{{ effectiveStatus.getTagText(item.record.effectiveStatus).text
              }}<el-tag v-if="item.record.scopeIssues.length" type="warning"
                >待补范围 {{ item.record.scopeIssues.length }}</el-tag
              ></template
            >
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
          fill
        >
          <in-table
            :loading="delegations.fetching.value"
            :data="delegations.pageInfo.value.records"
            :page="delegations.pageInfo.value"
            :headers="delegationHeaders"
            table-id="org-iam-delegations"
            density="compact"
            :row-key="rowKeyOf"
            @handleSizeChange="delegations.fetchData"
            @handleCurrentChange="delegations.fetchData"
          >
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
            <template #status="{ item }">{{ item.record.status }}</template>
            <template #maxAssignmentDuration="{ item }">
              {{ item.record.delegation.maxAssignmentDuration }}
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="delegationRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>

  <biz-iam-current-role-drawer
    ref="createRef"
    :apis="currentRoleApis"
    :catalog-a-p-i="TenantRoleGrantCatalogAPI"
    :application-candidates="applicationCandidates"
    @success="refreshRoles"
  />
  <biz-iam-current-role-drawer
    ref="detailRef"
    :apis="currentRoleApis"
    :catalog-a-p-i="TenantRoleGrantCatalogAPI"
    :application-candidates="applicationCandidates"
    @success="refreshRoles"
  />
  <biz-iam-tenant-assignment-drawer
    ref="assignmentRef"
    :apis="assignmentApis"
    @success="refreshAssignments"
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
import {
  useAssignmentSourceEnum,
  useAssignmentEffectiveStatusEnum,
  BizIamTenantAssignmentDrawer,
  BizIamTenantDelegationDrawer,
  BizIamCurrentRoleDrawer,
  createCurrentRoleApis,
  type AuthorizationCandidatesApi,
  type TenantAssignmentApis,
  type TenantDelegationApis,
  BizIamDiagnoseDrawer,
  BizIamRecordLink,
  BizIamStatusTag,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  RoleKind,
  createIamListLoader,
  toIamSelectRecords,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  Confirm,
  Message,
  type InTableAction,
  useCapabilities,
  type LoadDataParams,
} from "@ingot/admin-core";
import {
  TenantAssignmentCreateAPI,
  TenantAssignmentScopeCandidatesAPI,
  TenantAssignmentOptionsAPI,
  TenantAssignmentRoleDefinitionAPI,
  TenantDelegationMineAPI,
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
import { TenantApplicationPageAPI, TenantMemberPageAPI } from "@/api/iam/directory";
import {
  assignmentHeaders,
  createAssignmentRowActions,
  createAssignmentToolbarActions,
  createDelegationRowActions,
  createDelegationToolbarActions,
  createRoleRowActions,
  createRoleToolbarActions,
  delegationHeaders,
  emptyAssignmentRow,
  emptyDelegationRow,
  emptyRoleRow,
  ROLE_TABLE_ID,
  roleHeaders,
  type AssignmentRow,
  type DelegationRow,
  type RoleRow,
} from "./table";
import { useOps } from "./useOps";

const assignmentSource = useAssignmentSourceEnum();
const effectiveStatus = useAssignmentEffectiveStatusEnum();
const { hasAction, actionCodes } = useCapabilities();
const tab = ref(hasAction(IamAction.TENANT_ROLE_READ) ? "roles" : "assignments");
watch(actionCodes, () => {
  if (tab.value === "roles" && !hasAction(IamAction.TENANT_ROLE_READ)) tab.value = "assignments";
});
const { roles, assignments, delegations, refreshRoles, refreshAssignments, refreshDelegations } =
  useOps(tab);
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (id: string) => void }>();
const assignmentRef = ref<{ show: (row?: AssignmentRow) => void }>();
const delegationRef = ref<{ show: (row?: DelegationRow) => void }>();
const diagnoseRef = ref<{ show: (preset?: { memberId?: string }) => void }>();

const loadMembers = async (params: LoadDataParams) => {
  const response = await TenantMemberPageAPI(
    { current: params.current, size: params.size ?? IAM_DEFAULT_PAGE_SIZE },
    { name: params.query, keyword: params.query },
  );
  return toIamSelectRecords(response.data);
};
const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await TenantApplicationPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const currentRoleApis = createCurrentRoleApis("tenant");
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

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleDetail = (item: RoleRow): void => {
  detailRef.value?.show(item.record.id);
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
      refreshAssignments();
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
  createRoleRowActions(item, { onDetail: handleDetail });
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
