<template>
  <div class="dept-tab" :style="tableTone">
    <in-table
      :loading="fetching"
      :data="visibleTree"
      :headers="visibleHeaders"
      :table-id="TABLE_ID"
      tree-column="name"
      row-key="id"
      :tree-expand="canExpandDept"
      :checkbox="checkboxModeOf"
      :feedback="searchName.trim() ? 'no-result' : 'none'"
      v-model:expand-row-keys="expandRowKeys"
      @selection-change="privateOnSelectionChange"
    >
      <template #tools-start>
        <el-input
          v-model="searchName"
          class="w-200px"
          clearable
          placeholder="搜索部门名"
          :prefix-icon="Search"
        />
        <in-table-column-setting
          :headers="tableHeaders"
          :table-id="TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions
          variant="toolbar"
          :actions="toolbarActions"
          :row="toolbarRow"
          :selected-count="selectedRows.length"
        />
      </template>
      <template #name-header>
        <span class="whitespace-nowrap">{{ nameHeader }}</span>
      </template>
      <template #name="{ item }">
        <span
          class="dept-name"
          :class="{
            'is-root': isRootDepartment(item),
            'is-link': !isRootDepartment(item) && !item.navigationOnly,
          }"
          @click="privateOnNameClick(item)"
        >
          {{ item.name }}
        </span>
      </template>
      <template #leaderSummary="{ item }">
        <span
          v-if="item.leaderSummary"
          class="inline-flex max-w-full items-center gap-8px align-middle"
        >
          <in-avatar
            v-if="item.leaderSummary.primaryLeader"
            class="dept-leader-avatar shrink-0"
            :src="item.leaderSummary.primaryLeader.avatar"
            :name="item.leaderSummary.primaryLeader.displayName || '姓名受限'"
            :show-name="false"
            :size="MEMBER_AVATAR_SIZE"
          />
          <span class="min-w-0 truncate" :title="formatDepartmentLeaderSummary(item.leaderSummary)">
            {{ formatDepartmentLeaderSummary(item.leaderSummary) }}
          </span>
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>

    <DeptCreateDrawer ref="createRef" @success="privateRefresh" />
    <DeptDetailDrawer ref="detailRef" @success="privateRefresh" />
  </div>
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import { InAvatar, Message, type InTableAction, type InTableCheckboxMode } from "@ingot/admin-core";
import { TenantDepartmentDeleteAPI } from "@/api/iam/directory";
import DeptCreateDrawer from "./DeptCreateDrawer.vue";
import DeptDetailDrawer from "./DeptDetailDrawer.vue";
import {
  collectDeletableDepts,
  createRowActions,
  createToolbarActions,
  DEPT_NAME_COLUMN_LABEL,
  formatSelectionColumnLabel,
  tableHeaders,
  type DeptRow,
} from "../deptTable";
import { DEPT_TABLE_ROW_HEIGHT, isRootDepartment } from "../deptTree";
import { useDeptOps } from "../useDeptOps";
import { formatDepartmentLeaderSummary } from "../leaderState";
import { MEMBER_AVATAR_SIZE } from "../memberTable";

defineOptions({ name: "DeptTab" });

const emits = defineEmits<{ success: [] }>();
const deptOps = useDeptOps();
const { fetching, searchName, expandRowKeys, visibleTree, visibleHeaders, TABLE_ID, loadDepts } =
  deptOps;
const createRef = ref<{ show: (options?: { parentId?: string }) => void }>();
const detailRef = ref<{ show: (row: { id: string }) => void }>();
const selectedRows = ref<DeptRow[]>([]);
const nameHeader = computed(() =>
  formatSelectionColumnLabel(DEPT_NAME_COLUMN_LABEL, selectedRows.value.length),
);
const toolbarRow = {
  record: { id: "", name: "", sortOrder: 0, navigationOnly: false },
  fieldAccess: {},
  capabilities: {},
  version: "",
  id: "",
  name: "",
  sortOrder: 0,
  navigationOnly: false,
} satisfies DeptRow;
const tableTone: Record<string, string> = {
  "--dept-table-row-height": `${DEPT_TABLE_ROW_HEIGHT}px`,
};

const canExpandDept = (row: DeptRow): boolean => !isRootDepartment(row);
const checkboxModeOf = (row: DeptRow): InTableCheckboxMode =>
  isRootDepartment(row) || row.navigationOnly ? "off" : "on";

const handleCreate = (parentId?: string): void => {
  createRef.value?.show({ parentId });
};

const handleDetail = (item: DeptRow): void => {
  if (item.navigationOnly || isRootDepartment(item)) {
    return;
  }
  detailRef.value?.show(item);
};

const handleRemove = (item: DeptRow): void => {
  if (!item.id || item.navigationOnly) {
    return;
  }
  TenantDepartmentDeleteAPI(item.id).then(() => {
    Message.success("已删除");
    privateRefresh();
  });
};

const handleImportExport = (): void => {
  Message.warning("部门批量导入导出即将开放");
};

const handleBatchDelete = async (): Promise<void> => {
  const targets = collectDeletableDepts(selectedRows.value);
  if (targets.length === 0) {
    Message.warning("没有可删除的部门");
    return;
  }
  let ok = 0;
  let fail = 0;
  for (const item of targets) {
    try {
      await TenantDepartmentDeleteAPI(item.id);
      ok += 1;
    } catch {
      fail += 1;
    }
  }
  if (fail === 0) {
    Message.success(`已删除 ${ok} 个部门`);
  } else {
    Message.warning(`成功 ${ok} 个，失败 ${fail} 个`);
  }
  if (ok > 0) {
    privateRefresh();
  }
};

const privateRefresh = (): void => {
  void loadDepts().then(() => {
    emits("success");
  });
};

const toolbarActions = computed(() =>
  createToolbarActions({
    onCreate: () => handleCreate(),
    onImportExport: handleImportExport,
    onBatchDelete: () => {
      void handleBatchDelete();
    },
    selectedCount: selectedRows.value.length,
  }),
);
const rowActionsOf = (item: DeptRow): Array<InTableAction<DeptRow>> =>
  createRowActions(item, {
    onDetail: handleDetail,
    onAddChild: (row) => handleCreate(row.id),
    onDelete: handleRemove,
  });

const privateOnNameClick = (item: DeptRow): void => {
  handleDetail(item);
};

const privateOnSelectionChange = (rows: DeptRow[]): void => {
  selectedRows.value = rows;
};

const privateOnColumnChange = (value: string[]): void => {
  deptOps.selectedColumnProps.value = value;
};

onMounted(() => {
  void loadDepts();
});
</script>

<style lang="postcss" scoped>
.dept-tab {
  height: 100%;
  min-height: 0;
}

.dept-tab :deep(.in-table) {
  --in-table-row-height: var(--dept-table-row-height);
}

.dept-tab :deep(.in-table-tree-cell:has(.dept-name.is-root) .in-table-tree-expand-spacer) {
  display: none;
  width: 0;
}

.dept-name {
  min-width: 0;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
}

.dept-leader-avatar {
  --in-text-color-inverse: var(--in-tag-solid-text-color);
}

.dept-name.is-link {
  cursor: pointer;
}

.dept-name.is-link:hover {
  color: var(--in-color-primary);
}
</style>
