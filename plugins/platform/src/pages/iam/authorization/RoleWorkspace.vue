<template>
  <in-split-layout
    left-collapsible
    :auto-collapse="false"
    :left-width="240"
    persistence-key="platform-iam-role-workspace"
  >
    <template #left>
      <div class="flex h-full min-h-0 flex-col gap-12px">
        <div class="flex flex-col gap-12px">
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
          <in-table-actions
            class="role-workspace__toolbar-actions"
            variant="toolbar"
            :actions="toolbarActions"
            :row="emptyRoleRow"
          />
        </div>
        <in-loading :loading="loading" class="flex-1 min-h-0 overflow-auto">
          <div
            v-for="row in rows"
            :key="row.record.id"
            class="flex h-36px items-center gap-4px pl-12px pr-4px mb-4px rounded-8px"
            :class="roleId === row.record.id ? 'bg-[var(--in-permission-panel-bg)]' : ''"
          >
            <button
              type="button"
              class="flex-1 h-full min-w-0 p-0 text-left border-none bg-transparent cursor-pointer text-[var(--in-text-color)]"
              @click="selectRole(row)"
            >
              <span class="block truncate" :title="row.record.name">{{ row.record.name }}</span>
            </button>
            <in-table-actions :actions="rowActions(row)" :row="row" />
          </div>
          <div v-if="!rows.length && !loading" class="p-12px text-[var(--el-text-color-secondary)]">
            暂无角色
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
      </div>
    </template>
    <div class="flex h-full min-h-0 flex-col">
      <div
        v-if="!hasAction(IamAction.PLATFORM_ASSIGNMENT_READ)"
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
        v-if="hasAction(IamAction.PLATFORM_ASSIGNMENT_READ)"
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
        <template #subtitle
          ><span v-if="restricted">组继承来源按当前组读取范围展示。</span></template
        >
        <template #tools-start>
          <el-input
            v-model="subjects.condition.keyword"
            clearable
            class="w-200px!"
            :placeholder="subjectKind === 'members' ? '搜索成员名称' : '搜索用户组名称'"
            :disabled="!roleId"
            @keyup.enter="subjects.search"
            @clear="subjects.search"
            ><template #prefix><in-icon name="ep:search" /></template
          ></el-input>
          <in-button :disabled="!roleId" @in-click="showVersions">{{
            version ? `固定版本 v${version.number}` : "所有版本"
          }}</in-button>
          <in-button v-if="version" link @in-click="version = undefined">清除版本</in-button>
          <in-table-column-setting
            :key="tableId"
            :headers="headers"
            :table-id="tableId"
            @change="selectedColumns[subjectKind] = $event"
          />
        </template>
        <template #name="{ item }">{{ item.name }}</template>
        <template #revisionNumbers="{ item }">{{
          item.revisionNumbers.map((value: number) => `v${value}`).join("、")
        }}</template>
        <template #sourceTypes="{ item }"
          >{{
            item.sourceTypes
              .map((type: string) => (type === "MEMBER" ? "直接分配" : "用户组"))
              .join("、")
          }}（{{ item.sourceCount }}）</template
        >
        <template #actions="{ item }"
          ><in-button
            link
            type="primary"
            @in-click="subjectKind === 'members' ? showSources(item.id) : showGroup(item.id)"
            >{{ subjectKind === "members" ? "查看来源" : "查看用户组" }}</in-button
          ></template
        >
      </in-table>
    </div>
  </in-split-layout>
  <in-dialog
    v-model="versionsVisible"
    title="选择固定版本"
    width="560px"
    layout="pinned"
    append-to-body
  >
    <div class="h-420px flex flex-col">
      <div class="mb-12px">
        {{ selectedRole?.record.name }}：请选择一个固定版本，默认查询所有版本。
      </div>
      <in-loading :loading="versions.fetching.value" class="flex-1 min-h-0 overflow-auto">
        <el-radio-group v-model="draftVersionId" class="flex flex-col items-start">
          <el-radio
            v-for="row in versions.pageInfo.value.records"
            :key="row.record.id"
            :value="row.record.id"
            >v{{ row.record.revision }}</el-radio
          >
        </el-radio-group>
      </in-loading>
      <el-pagination
        :current-page="versions.pageInfo.value.current || 1"
        :page-size="versions.pageInfo.value.size || 20"
        :total="versions.pageInfo.value.total || 0"
        layout="prev, pager, next"
        @current-change="versions.fetchData({ type: 'current', value: $event })"
      />
    </div>
    <template #footer
      ><in-button @in-click="versionsVisible = false">取消</in-button
      ><in-button type="primary" :disabled="!draftVersionId" @in-click="confirmVersion"
        >确定</in-button
      ></template
    >
  </in-dialog>
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
        <template #subject="{ item }"
          >{{ item.record.assignment.subject.type === "MEMBER" ? "成员直接分配" : "用户组继承" }} /
          {{ item.record.subjectName }}</template
        >
        <template #version="{ item }">v{{ item.record.revisionNumber }}</template>
        <template #basis="{ item }">{{ item.record.delegationSummary || "直接分配" }}</template>
        <template #validUntil="{ item }">{{
          item.record.assignment.validUntil
            ? new Date(item.record.assignment.validUntil).toLocaleString()
            : "长期（委派来源仍可失效）"
        }}</template>
        <template #actions="{ item }">
          <in-button link type="primary" @in-click="emits('assignment', item)">查看分配</in-button>
          <in-table-actions :row="item" :actions="sourceActions(item)" />
          <in-button
            v-if="
              item.record.assignment.subject.type === 'GROUP' &&
              hasAction(IamAction.PLATFORM_GROUP_READ)
            "
            link
            type="primary"
            @in-click="showGroup(item.record.assignment.subject.id)"
            >查看用户组</in-button
          >
        </template>
      </in-table>
    </div>
  </in-dialog>
  <group-detail-drawer ref="groupDetail" view-only />
</template>
<script setup lang="ts">
import {
  applyColumnSelection,
  useCapabilities,
  type InTableAction,
  type Page,
  type TableHeaderRecord,
} from "@ingot/admin-core";
import { IamAction, type RoleSubjectSummary } from "@ingot/admin-common";
import GroupDetailDrawer from "../personnel/components/GroupDetailDrawer.vue";
import {
  createAssignmentRowActions,
  emptyRoleRow,
  type RoleRow,
  type AssignmentRow,
} from "./table";
import { useRoleWorkspace } from "./useRoleWorkspace";

defineOptions({ name: "RoleWorkspace" });
const props = defineProps<{
  active: boolean;
  rows: RoleRow[];
  loading: boolean;
  page: Page<RoleRow>;
  name?: string;
  toolbarActions: InTableAction<RoleRow>[];
  rowActions: (row: RoleRow) => InTableAction<RoleRow>[];
}>();
const emits = defineEmits<{
  "update:name": [name: string];
  search: [];
  page: [page: number];
  assignment: [row: AssignmentRow];
  revoke: [row: AssignmentRow];
}>();
const { hasAction } = useCapabilities();
const {
  roleId,
  subjectKind,
  version,
  subjects,
  restricted,
  refresh,
  sources,
  sourcesVisible,
  showSources,
  versions,
  versionsVisible,
  showVersions,
} = useRoleWorkspace(() => props.active);
const selectedRole = ref<RoleRow>();
const sourceActions = (row: AssignmentRow): InTableAction<AssignmentRow>[] =>
  createAssignmentRowActions(row, {
    onEdit: (item) => emits("assignment", item),
    onDelete: (item) => emits("revoke", item),
    onDiagnose: () => {},
  }).filter((action) => action.key !== "diagnose");
const selectedColumns = ref<Record<string, string[]>>({ members: [], groups: [] });
const tableId = computed(() => `platform-iam-role-${subjectKind.value}`);
const headers: TableHeaderRecord[] = [
  { label: "名称", prop: "name", required: true, minWidth: 180, showOverflowTooltip: true },
  { label: "固定版本", prop: "revisionNumbers", minWidth: 160, showOverflowTooltip: true },
  { label: "分配来源", prop: "sourceTypes", minWidth: 180, showOverflowTooltip: true },
  { label: "操作", prop: "actions", width: 140, fixed: "right" },
];
const sourceHeaders: TableHeaderRecord[] = [
  { label: "接收对象", prop: "subject", minWidth: 200, showOverflowTooltip: true },
  { label: "版本", prop: "version", minWidth: 100 },
  { label: "授权依据", prop: "basis", minWidth: 180, showOverflowTooltip: true },
  { label: "失效时间", prop: "validUntil", minWidth: 200, showOverflowTooltip: true },
  { label: "操作", prop: "actions", width: 330, fixed: "right" },
];
const visibleHeaders = computed(() =>
  applyColumnSelection(headers, selectedColumns.value[subjectKind.value]),
);
const draftVersionId = ref("");
const knownVersions = ref(new Map<string, { id: string; number: string }>());
watch(
  () => versions.pageInfo.value.records,
  (rows) => {
    for (const row of rows || [])
      knownVersions.value.set(row.record.id, { id: row.record.id, number: row.record.revision });
  },
);
watch(roleId, () => knownVersions.value.clear());
const groupDetail = ref<InstanceType<typeof GroupDetailDrawer>>();
const selectRole = (row?: RoleRow): void => {
  selectedRole.value = row;
  roleId.value = row?.record.id || "";
};
const showGroup = async (id: string): Promise<void> => {
  if (!hasAction(IamAction.PLATFORM_GROUP_READ)) return;
  groupDetail.value?.show({
    record: { id, name: "", selection: { members: [], departments: [] } },
    capabilities: {},
    fieldAccess: {},
    version: "",
  });
};
const confirmVersion = (): void => {
  const selected = knownVersions.value.get(draftVersionId.value);
  if (!selected) return;
  version.value = selected;
  versionsVisible.value = false;
};
const subjectKey = (row: RoleSubjectSummary): string => row.id;
const assignmentKey = (row: AssignmentRow): string => row.record.id;
watch(
  () => props.rows,
  (rows) => selectRole(rows.find((row) => row.record.id === roleId.value) || rows[0]),
  { immediate: true },
);
watch(versionsVisible, (visible) => {
  if (visible) draftVersionId.value = version.value?.id || "";
});
defineExpose({ refresh });
</script>

<style scoped lang="postcss">
.role-workspace__toolbar-actions :deep(.in-table-actions__hit) {
  flex: 1 1 0;
}

.role-workspace__toolbar-actions :deep(.in-table-actions__hit .in-table-actions__inline) {
  width: 100%;
  justify-content: center;
}
</style>
