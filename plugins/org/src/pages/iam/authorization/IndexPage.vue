<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="角色、授权记录与授权管理员。诊断为工具入口，不提供模拟执行。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel title="角色" name="roles">
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
              <in-table-actions variant="toolbar" :actions="roleToolbarActions" :row="emptyRoleRow" />
            </template>
            <template #name="{ item }">
              <in-button text link @click="handleDetail(item)">
                {{ item.record.name || item.record.id }}
              </in-button>
            </template>
            <template #kind="{ item }">{{ item.record.kind }}</template>
            <template #status="{ item }">
              <biz-iam-status-tag :status="item.record.status" />
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="roleRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="授权记录" name="assignments">
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
              {{ item.record.assignment.subject.type }} / {{ item.record.assignment.subject.id }}
            </template>
            <template #roleRevision="{ item }">
              {{ item.record.assignment.roleRevisionRef.kind }} /
              {{ item.record.assignment.roleRevisionRef.id }}
            </template>
            <template #source="{ item }">{{ item.record.source }}</template>
            <template #status="{ item }">{{ item.record.status }}</template>
            <template #validUntil="{ item }">
              {{ item.record.assignment.validUntil || "长期" }}
            </template>
            <template #actions="{ item }">
              <in-table-actions :actions="assignmentRowActionsOf(item)" :row="item" />
            </template>
          </in-table>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="授权管理员" name="delegations">
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
              {{ item.record.delegation.administratorMemberId }}
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

  <biz-iam-role-create-drawer
    ref="createRef"
    title="创建组织角色"
    :kind="RoleKind.TENANT_CUSTOM"
    :create-api="TenantRoleCreateAPI"
    @success="refreshRoles"
  />
  <biz-iam-role-create-drawer
    ref="customizeRef"
    title="基于共享版本定制"
    :kind="RoleKind.TENANT_CUSTOM"
    allow-deltas
    :create-api="TenantRoleCreateAPI"
    @success="refreshRoles"
  />
  <biz-iam-role-detail-drawer
    ref="detailRef"
    allow-deltas
    :get-api="TenantRoleDetailAPI"
    :list-revisions-api="TenantRoleRevisionPageAPI"
    :preview-api="TenantRolePreviewAPI"
    :publish-api="TenantRolePublishAPI"
    :status-api="TenantRoleStatusAPI"
    :delete-api="TenantRoleDeleteAPI"
    :upgrade-preview-api="TenantRoleUpgradePreviewAPI"
    :upgrade-api="TenantRoleUpgradeAPI"
    :publish-action="IamAction.TENANT_ROLE_PUBLISH"
    :status-action="IamAction.TENANT_ROLE_STATUS"
    :delete-action="IamAction.TENANT_ROLE_DELETE"
    :upgrade-action="IamAction.TENANT_ROLE_UPGRADE"
    @success="refreshRoles"
  />
  <biz-iam-assignment-drawer
    ref="assignmentRef"
    :load-members="loadMembers"
    :load-groups="loadGroups"
    :load-roles="loadRoles"
    :list-revisions-api="TenantRoleRevisionPageAPI"
    :load-departments="loadDepartments"
    :create-api="TenantAssignmentCreateAPI"
    :preview-api="TenantAssignmentPreviewAPI"
    :update-api="TenantAssignmentUpdateAPI"
    @success="refreshAssignments"
  />
  <biz-iam-delegation-drawer
    ref="delegationRef"
    :load-members="loadMembers"
    :load-roles="loadRoles"
    :list-revisions-api="TenantRoleRevisionPageAPI"
    :load-departments="loadDepartments"
    :create-api="TenantDelegationCreateAPI"
    :get-api="TenantDelegationDetailAPI"
    :update-api="TenantDelegationUpdateAPI"
    :preview-api="TenantDelegationPreviewAPI"
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
import {
  BizIamAssignmentDrawer,
  BizIamDelegationDrawer,
  BizIamDiagnoseDrawer,
  BizIamRoleCreateDrawer,
  BizIamRoleDetailDrawer,
  BizIamStatusTag,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  RoleKind,
  createIamListLoader,
  toIamSelectRecords,
  type ResourceDetail,
} from "@ingot/admin-common";
import { Confirm, Message, type InTableAction, type LoadDataParams } from "@ingot/admin-core";
import {
  TenantAssignmentCreateAPI,
  TenantAssignmentDeleteAPI,
  TenantAssignmentPreviewAPI,
  TenantAssignmentUpdateAPI,
  TenantDelegationCreateAPI,
  TenantDelegationDeleteAPI,
  TenantDelegationDetailAPI,
  TenantDelegationPreviewAPI,
  TenantDelegationUpdateAPI,
  TenantDiagnoseAPI,
  TenantRoleCreateAPI,
  TenantRoleDeleteAPI,
  TenantRoleDetailAPI,
  TenantRolePageAPI,
  TenantRolePreviewAPI,
  TenantRolePublishAPI,
  TenantRoleRevisionPageAPI,
  TenantRoleStatusAPI,
  TenantRoleUpgradeAPI,
  TenantRoleUpgradePreviewAPI,
} from "@/api/iam/authorization";
import {
  TenantApplicationPageAPI,
  TenantDepartmentPageAPI,
  TenantGroupPageAPI,
  TenantMemberPageAPI,
} from "@/api/iam/directory";
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

const tab = ref("roles");
const { roles, assignments, delegations, refreshRoles, refreshAssignments, refreshDelegations } =
  useOps();
const createRef = ref<{ show: () => void }>();
const customizeRef = ref<{ show: () => void }>();
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
const loadGroups = createIamListLoader(async (page, condition) => {
  const response = await TenantGroupPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadRoles = createIamListLoader(async (page, condition) => {
  const response = await TenantRolePageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await TenantApplicationPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleCustomize = (): void => {
  customizeRef.value?.show();
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
  createRoleToolbarActions(handleCreate, handleCustomize, () => handleDiagnose()),
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
const delegationToolbarActions = computed(() => createDelegationToolbarActions(handleDelegationCreate));
const delegationRowActionsOf = (item: DelegationRow): Array<InTableAction<DelegationRow>> =>
  createDelegationRowActions(item, {
    onEdit: handleDelegationEdit,
    onDelete: handleDelegationDelete,
  });
const rowKeyOf = (row: ResourceDetail<{ id: string }>): string => row.record.id;
</script>
