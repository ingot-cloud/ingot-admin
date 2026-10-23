<template>
  <in-split-layout
    left-collapsible
    :auto-collapse="false"
    :left-width="240"
    persistence-key="org-iam-role-workspace"
  >
    <template #left>
      <div class="flex h-full min-h-0 flex-col gap-12px">
        <el-input
          :model-value="name"
          clearable
          placeholder="搜索角色名称"
          @update:model-value="emits('update:name', $event)"
          @keyup.enter="emits('search')"
          @clear="emits('search')"
        >
          <template #prefix><in-icon name="ep:search" /></template>
        </el-input>
        <in-loading :loading="loading" class="flex-1 min-h-0 overflow-auto">
          <div class="flex min-h-0 flex-col">
            <div
              v-for="row in rows"
              :key="row.record.id"
              class="flex flex-none h-36px items-center gap-4px pl-12px pr-4px mb-4px rounded-8px"
              :class="roleId === row.record.id ? 'bg-[var(--in-permission-panel-bg)]' : ''"
            >
              <button
                type="button"
                class="flex flex-1 h-full min-w-0 items-center gap-8px p-0 text-left border-none bg-transparent cursor-pointer text-[var(--in-text-color)]"
                @click="selectRole(row)"
              >
                <span class="truncate" :title="row.record.name">{{
                  row.record.name || "未命名角色"
                }}</span>
                <in-tag
                  v-if="row.record.kind === RoleKind.SHARED"
                  class="shrink-0"
                  size="small"
                  :value="SYSTEM_ROLE_TAG"
                />
              </button>
              <in-table-actions :actions="rowActions(row)" :row="row" />
            </div>
            <div v-if="!rows.length && !loading" class="p-12px text-[var(--el-text-color-secondary)]">
              暂无角色
            </div>
          </div>
        </in-loading>
        <el-pagination
          :current-page="page.current || 1"
          :page-size="page.size || 20"
          :total="page.total || 0"
          layout="prev, pager, next"
          size="small"
          class="justify-center"
          @current-change="emits('page', $event)"
        />
        <in-button type="primary" :disabled="!canCreate" @in-click="emits('create')">
          创建角色
        </in-button>
      </div>
    </template>
    <div class="flex h-full min-h-0 flex-col">
      <div
        v-if="!hasAction(IamAction.TENANT_ASSIGNMENT_READ)"
        class="p-24px text-[var(--el-text-color-secondary)]"
      >
        可以查看角色详情；当前没有角色分配读取权限。
      </div>
      <in-biz-tabs-header
        v-else
        v-model="subjectKind"
        :tabs="[
          { id: 'members', title: '成员' },
          { id: 'groups', title: '用户组' },
        ]"
      />
      <in-table
        v-if="hasAction(IamAction.TENANT_ASSIGNMENT_READ)"
        :loading="subjects.fetching.value"
        :data="subjects.pageInfo.value.records"
        :page="subjects.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="tableId"
        density="compact"
        :row-key="subjectKey"
        @handleSizeChange="subjects.fetchData"
        @handleCurrentChange="subjects.fetchData"
      >
        <template #title>{{ selectedRole?.record.name || "请先选择角色" }}</template>
        <template #subtitle>
          <template v-if="selectedRole">
            <div>{{ selectedRole.record.description || "暂无说明" }}</div>
            <div v-if="restricted">组继承来源按当前组读取范围展示。</div>
          </template>
        </template>
        <template #tools-start>
          <el-input
            v-model="subjects.condition.keyword"
            clearable
            class="w-200px!"
            :placeholder="subjectKind === 'members' ? '搜索成员名称' : '搜索用户组名称'"
            :disabled="!roleId"
            @keyup.enter="subjects.search"
            @clear="subjects.search"
          >
            <template #prefix><in-icon name="ep:search" /></template>
          </el-input>
          <in-table-column-setting
            :key="tableId"
            :headers="headers"
            :table-id="tableId"
            @change="selectedColumns[subjectKind] = $event"
          />
        </template>
        <template #name="{ item }">
          <biz-iam-record-link :action="subjectReadAction" @click="showSubject(item)">
            {{ item.name || "未命名" }}
          </biz-iam-record-link>
        </template>
        <template #departments="{ item }">{{ formatMemberDepartments(item.departments) }}</template>
        <template #actions="{ item }">
          <in-button
            v-if="subjectKind === 'members'"
            link
            type="primary"
            @in-click="showSources(item.id)"
            >查看来源</in-button
          >
        </template>
      </in-table>
    </div>
  </in-split-layout>
  <in-dialog
    v-model="sourcesVisible"
    title="有效分配来源"
    width="1000px"
    layout="pinned"
    append-to-body
  >
    <div class="h-480px">
      <in-table
        :loading="sources.fetching.value"
        :data="sources.pageInfo.value.records"
        :page="sources.pageInfo.value"
        :headers="sourceHeaders"
        :row-key="assignmentKey"
        density="compact"
        @handleSizeChange="sources.fetchData"
        @handleCurrentChange="sources.fetchData"
      >
        <template #subject="{ item }">
          {{ item.record.assignment.subject.type === "MEMBER" ? "成员直接分配" : "用户组继承" }} /
          {{ item.record.subjectName || "未命名" }}
        </template>
        <template #basis="{ item }">{{
          item.record.assignment.delegationGrantId ? "授权管理员分配" : "直接分配"
        }}</template>
        <template #validUntil="{ item }">
          {{ formatDateTime(item.record.assignment.validUntil, { fallback: "长期" }) }}
        </template>
        <template #actions="{ item }">
          <div class="inline-flex items-center align-middle gap-[var(--in-space-2)]">
            <in-button link type="primary" @in-click="emits('assignment', item)">查看分配</in-button>
            <in-table-actions :row="item" :actions="sourceActions(item)" />
            <in-button
              v-if="
                item.record.assignment.subject.type === 'GROUP' &&
                hasAction(IamAction.TENANT_GROUP_READ)
              "
              link
              type="primary"
              @in-click="showGroup(item.record.assignment.subject.id, item.record.subjectName)"
              >查看用户组</in-button
            >
          </div>
        </template>
      </in-table>
    </div>
  </in-dialog>
  <group-detail-drawer ref="groupDetail" view-only />
  <member-detail-drawer ref="memberDetail" view-only />
</template>

<script setup lang="ts">
import { formatDateTime } from "@ingot/shared";
import {
  applyColumnSelection,
  useCapabilities,
  type InTableAction,
  type Page,
  type TableHeaderRecord,
} from "@ingot/admin-core";
import {
  BizIamRecordLink,
  IamAction,
  MemberStatus,
  RoleKind,
  type RoleSubjectSummary,
} from "@ingot/admin-common";
import GroupDetailDrawer from "../../groups/components/GroupDetailDrawer.vue";
import MemberDetailDrawer from "../../members/components/MemberDetailDrawer.vue";
import { formatMemberDepartments } from "../../members/memberTable";
import { useRoleWorkspace } from "../useRoleWorkspace";
import {
  createAssignmentRowActions,
  SYSTEM_ROLE_TAG,
  type AssignmentRow,
  type RoleRow,
} from "../table";

defineOptions({ name: "RoleWorkspace" });

const props = defineProps<{
  active: boolean;
  rows: RoleRow[];
  loading: boolean;
  page: Page<RoleRow>;
  name?: string;
  rowActions: (row: RoleRow) => InTableAction<RoleRow>[];
}>();

const emits = defineEmits<{
  "update:name": [name: string];
  search: [];
  page: [page: number];
  create: [];
  assignment: [row: AssignmentRow];
  revoke: [row: AssignmentRow];
}>();

const { hasAction } = useCapabilities();
const canCreate = computed(() => hasAction(IamAction.TENANT_ROLE_CREATE));
const {
  roleId,
  subjectKind,
  subjects,
  restricted,
  refresh,
  sources,
  sourcesVisible,
  showSources,
} = useRoleWorkspace(() => props.active);
const selectedRole = ref<RoleRow>();
const selectedColumns = ref<Record<string, string[]>>({ members: [], groups: [] });
const tableId = computed(() => `org-iam-role-${subjectKind.value}`);
const nameHeader: TableHeaderRecord = {
  label: "名称",
  prop: "name",
  required: true,
  minWidth: 180,
  showOverflowTooltip: true,
};
const departmentHeader: TableHeaderRecord = {
  label: "部门",
  prop: "departments",
  minWidth: 180,
  showOverflowTooltip: true,
};
const actionsHeader: TableHeaderRecord = {
  label: "操作",
  prop: "actions",
  width: 140,
  fixed: "right",
};
const headers = computed<TableHeaderRecord[]>(() =>
  subjectKind.value === "members" ? [nameHeader, departmentHeader, actionsHeader] : [nameHeader],
);
const subjectReadAction = computed(() =>
  subjectKind.value === "members" ? IamAction.TENANT_MEMBER_READ : IamAction.TENANT_GROUP_READ,
);
const sourceHeaders: TableHeaderRecord[] = [
  { label: "接收对象", prop: "subject", minWidth: 200, showOverflowTooltip: true },
  { label: "授权依据", prop: "basis", minWidth: 180, showOverflowTooltip: true },
  {
    label: "失效时间",
    prop: "validUntil",
    transform: formatDateTime,
    minWidth: 200,
    showOverflowTooltip: true,
  },
  { label: "操作", prop: "actions", width: 280, fixed: "right" },
];
const visibleHeaders = computed(() =>
  applyColumnSelection(headers.value, selectedColumns.value[subjectKind.value]),
);
const sourceActions = (row: AssignmentRow): InTableAction<AssignmentRow>[] =>
  createAssignmentRowActions(row, {
    onEdit: (item) => emits("assignment", item),
    onDelete: (item) => emits("revoke", item),
    onDiagnose: () => {},
  }).filter((action) => action.key !== "diagnose");
const groupDetail = ref<InstanceType<typeof GroupDetailDrawer>>();
const memberDetail = ref<InstanceType<typeof MemberDetailDrawer>>();
const subjectKey = (row: RoleSubjectSummary): string => row.id;
const assignmentKey = (row: AssignmentRow): string => row.record.id;

const selectRole = (row?: RoleRow): void => {
  selectedRole.value = row;
  roleId.value = row?.record.id || "";
};
const showGroup = (id: string, name?: string): void => {
  if (!hasAction(IamAction.TENANT_GROUP_READ)) return;
  groupDetail.value?.show({
    record: { id, name: name || "", selection: { members: [], departments: [] } },
    capabilities: {},
    fieldAccess: {},
    version: "",
  });
};
const showSubject = (item: RoleSubjectSummary): void => {
  if (subjectKind.value === "groups") {
    showGroup(item.id, item.name);
    return;
  }
  if (!hasAction(IamAction.TENANT_MEMBER_READ)) return;
  memberDetail.value?.show({
    record: {
      id: item.id,
      displayName: item.name,
      status: MemberStatus.ACTIVE,
      departments: [],
    },
    capabilities: {},
    fieldAccess: {},
    version: "",
  });
};

watch(
  () => props.rows,
  (rows) => selectRole(rows.find((row) => row.record.id === roleId.value) || rows[0]),
  { immediate: true },
);

defineExpose({ refresh });
</script>
