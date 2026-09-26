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
              <biz-iam-record-link
                :action="IamAction.PLATFORM_ROLE_READ"
                :capabilities="item.capabilities"
                @click="handleDetail(item)"
              >
                {{ item.record.name || item.record.id }}
              </biz-iam-record-link>
            </template>
            <template #code="{ item }">
              <in-copy-tag v-if="item.record.code" :text="item.record.code" />
              <span v-else>-</span>
            </template>
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
            table-id="platform-iam-assignments"
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
              {{ subjectLabel(item.record.assignment.subject.type) }} /
              {{ item.record.assignment.subject.id }}
            </template>
            <template #roleRevision="{ item }">
              {{ roleKindLabel(item.record.assignment.roleRevisionRef.kind) }} /
              {{ item.record.assignment.roleRevisionRef.id }}
            </template>
            <template #source="{ item }">{{ sourceLabel(item.record.source) }}</template>
            <template #status="{ item }">
              <status-tag
                v-if="grantStatusTone(item.record.status)"
                :tone="grantStatusTone(item.record.status)"
                :label="grantStatusLabel(item.record.status)"
              />
              <span v-else>{{ grantStatusLabel(item.record.status) }}</span>
            </template>
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
            table-id="platform-iam-delegations"
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
  <biz-iam-assignment-drawer
    ref="assignmentRef"
    :load-members="loadMembers"
    :load-groups="loadGroups"
    :load-roles="loadRoles"
    :list-revisions-api="PlatformRoleRevisionPageAPI"
    :create-api="PlatformAssignmentCreateAPI"
    :preview-api="PlatformAssignmentPreviewAPI"
    :update-api="PlatformAssignmentUpdateAPI"
    @success="refreshAssignments"
  />
  <biz-iam-delegation-drawer
    ref="delegationRef"
    :load-members="loadMembers"
    :load-roles="loadRoles"
    :list-revisions-api="PlatformRoleRevisionPageAPI"
    :create-api="PlatformDelegationCreateAPI"
    :get-api="PlatformDelegationDetailAPI"
    :update-api="PlatformDelegationUpdateAPI"
    :preview-api="PlatformDelegationPreviewAPI"
    @success="refreshDelegations"
  />
  <biz-iam-diagnose-drawer
    ref="diagnoseRef"
    :load-members="loadMembers"
    :load-applications="loadApplications"
    :diagnose-api="PlatformDiagnoseAPI"
  />
</template>

<script lang="ts" setup>
import {
  AssignmentSourceExtArray,
  AuthorizationDomain,
  BizIamAssignmentDrawer,
  BizIamDelegationDrawer,
  BizIamDiagnoseDrawer,
  BizIamRecordLink,
  BizIamStatusTag,
  GrantStatusExtArray,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  RoleKind,
  RoleKindExtArray,
  SubjectTypeExtArray,
  createIamListLoader,
  GrantStatus,
  iamEnumLabel,
  toIamSelectRecords,
  type ResourceDetail,
} from "@ingot/admin-common";
import { Confirm, Message, StatusTag, type InTableAction, type LoadDataParams } from "@ingot/admin-core";
import {
  PlatformAssignmentCreateAPI,
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
  PlatformRolePageAPI,
  PlatformRolePublishAPI,
  PlatformRoleRevisionPageAPI,
  PlatformRoleStatusAPI,
  PlatformRoleUpdateAPI,
} from "@/api/iam/authorization";
import CreateWizard from "../shared-roles/components/CreateWizard.vue";
import SharedRoleDetailDrawer from "../shared-roles/components/SharedRoleDetailDrawer.vue";
import { PlatformApplicationPageAPI } from "@/api/iam/catalog";
import { PlatformGroupPageAPI, PlatformMemberPageAPI } from "@/api/iam/personnel";
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
  useOps(tab);
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (id: string) => void }>();
const assignmentRef = ref<{ show: (row?: AssignmentRow) => void }>();
const delegationRef = ref<{ show: (row?: DelegationRow) => void }>();
const diagnoseRef = ref<{ show: (preset?: { memberId?: string }) => void }>();

const loadMembers = async (params: LoadDataParams) => {
  const response = await PlatformMemberPageAPI(
    { current: params.current, size: params.size ?? IAM_DEFAULT_PAGE_SIZE },
    { name: params.query, keyword: params.query },
  );
  return toIamSelectRecords(response.data);
};
const loadGroups = createIamListLoader(async (page, condition) => {
  const response = await PlatformGroupPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadRoles = createIamListLoader(async (page, condition) => {
  const response = await PlatformRolePageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await PlatformApplicationPageAPI(page, {
    ...condition,
    domain: AuthorizationDomain.PLATFORM,
  });
  return { data: toIamSelectRecords(response.data) };
});

const subjectLabel = (value: string): string => iamEnumLabel(SubjectTypeExtArray, value);
const roleKindLabel = (value: string): string => iamEnumLabel(RoleKindExtArray, value);
const sourceLabel = (value: string): string => iamEnumLabel(AssignmentSourceExtArray, value);
const grantStatusLabel = (value: string): string => iamEnumLabel(GrantStatusExtArray, value);
const grantStatusTone = (value: GrantStatus | string): "info" | "danger" | undefined => {
  if (value === GrantStatus.ACTIVE) {
    return "info";
  }
  if (value === GrantStatus.REVOKED) {
    return "danger";
  }
  return undefined;
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
    PlatformAssignmentDeleteAPI(item.record.id).then(() => {
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
    PlatformDelegationDeleteAPI(item.record.id).then(() => {
      Message.success("已撤销委派");
      refreshDelegations();
    });
  });
};

const roleToolbarActions = computed(() => createRoleToolbarActions(handleCreate, () => handleDiagnose()));
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
const delegationToolbarActions = computed(() => createDelegationToolbarActions(handleDelegationCreate));
const delegationRowActionsOf = (item: DelegationRow): Array<InTableAction<DelegationRow>> =>
  createDelegationRowActions(item, {
    onEdit: handleDelegationEdit,
    onDelete: handleDelegationDelete,
  });
const rowKeyOf = (row: ResourceDetail<{ id: string }>): string => row.record.id;
</script>
