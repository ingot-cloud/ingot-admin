<template>
  <in-split-layout left-collapsible :persistence-key="MEMBER_SPLIT_KEY">
    <template #left>
      <DeptTreePanel
        :data="memberOps.deptTree.value"
        :loading="memberOps.deptLoading.value"
        :tenant-avatar="memberOps.tenantAvatar.value"
        @node-click="memberOps.handleTreeNodeClick"
      />
    </template>

    <in-table
      :loading="memberOps.paging.fetching.value"
      :data="memberOps.paging.pageInfo.value.records"
      :page="memberOps.paging.pageInfo.value"
      :headers="memberOps.visibleHeaders.value"
      :table-id="TABLE_ID"
      density="compact"
      :row-key="memberOps.rowKeyOf"
      @handleSizeChange="memberOps.paging.fetchData"
      @handleCurrentChange="memberOps.paging.fetchData"
      @selection-change="privateOnSelectionChange"
    >
      <template #title>
        <span>{{ memberOps.currentDept.value?.name || "成员" }}</span>
        <span class="in-table__count">共 {{ memberOps.paging.pageInfo.value.total ?? 0 }} 人</span>
      </template>
      <template #tools-start>
        <el-input
          v-if="memberOps.canFilter('phone')"
          v-model="memberOps.paging.condition.phone"
          class="w-200px!"
          clearable
          placeholder="搜索手机号"
          :prefix-icon="Search"
          @keyup.enter="memberOps.refreshData()"
          @clear="memberOps.refreshData()"
        />
        <el-input
          v-if="memberOps.canFilter('email')"
          v-model="memberOps.paging.condition.email"
          class="w-200px!"
          clearable
          placeholder="搜索邮箱"
          :prefix-icon="Search"
          @keyup.enter="memberOps.refreshData()"
          @clear="memberOps.refreshData()"
        />
        <in-picker v-model="statusFilter" label="账号状态" :options="statusOptions" />
        <in-table-column-setting
          :headers="memberOps.permissionHeaders.value"
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
      <template #displayName-header>
        <span class="whitespace-nowrap">{{ displayNameHeader }}</span>
      </template>
      <template #displayName="{ item }">
        <div class="member-name">
          <in-avatar
            v-if="isFieldVisible(item.fieldAccess, 'avatar')"
            :src="item.record.avatar"
            :name="item.record.displayName || item.record.id"
            :size="MEMBER_AVATAR_SIZE"
            :show-name="false"
          />
          <biz-iam-record-link
            v-if="isFieldVisible(item.fieldAccess, 'displayName')"
            class="member-name__link"
            :action="IamAction.TENANT_MEMBER_READ"
            :capabilities="item.capabilities"
            @click="handleDetail(item)"
          >
            {{ item.record.displayName }}
          </biz-iam-record-link>
        </div>
      </template>
      <template #status="{ item }">
        <status-tag
          v-if="memberStatusTone(item.record.status)"
          :tone="statusToneOf(item.record.status)"
          :label="memberStatusEnum.getTagText(item.record.status).text"
        />
      </template>
      <template #phone="{ item }">
        <span>{{ item.record.phone || "-" }}</span>
      </template>
      <template #departments="{ item }">
        <span>{{ formatMemberDepartments(item.record.departments) }}</span>
      </template>
      <template #loginPhone="{ item }">
        <span>{{ item.record.loginPhone || "-" }}</span>
      </template>
      <template #email="{ item }">
        <span v-if="isFieldVisible(item.fieldAccess, 'email')">{{ item.record.email || "-" }}</span>
      </template>
      <template #joinedAt="{ item }">
        <span>{{ formatDateTime(item.record.joinedAt) }}</span>
      </template>
      <template #updatedAt="{ item }">
        <span>{{ formatDateTime(item.record.updatedAt) }}</span>
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
  </in-split-layout>

  <MemberCreateDrawer ref="createRef" @success="refreshAll" />
  <MemberDetailDrawer ref="detailRef" @success="memberOps.refreshData()" />
  <MemberExportDrawer ref="exportRef" />
  <MemberBatchDepartmentDrawer ref="batchDeptRef" @success="memberOps.refreshData()" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  Confirm,
  Message,
  resolveStringPickerFilter,
  StatusTag,
  toStringPickerValue,
  withAllPickerOption,
  type InTableAction,
} from "@ingot/admin-core";
import {
  BizIamRecordLink,
  IamAction,
  MemberStatus,
  isFieldVisible,
  memberStatusTone,
  useMemberStatusEnum,
} from "@ingot/admin-common";
import { formatDateTime } from "@ingot/shared";
import { TenantMemberRemoveAPI, TenantMemberStatusAPI } from "@/api/iam/directory";
import DeptTreePanel from "./DeptTreePanel.vue";
import MemberCreateDrawer from "./MemberCreateDrawer.vue";
import MemberDetailDrawer from "./MemberDetailDrawer.vue";
import MemberExportDrawer from "./MemberExportDrawer.vue";
import MemberBatchDepartmentDrawer from "./MemberBatchDepartmentDrawer.vue";
import {
  collectActiveMembers,
  createRowActions,
  createToolbarActions,
  formatMemberDepartments,
  formatSelectionColumnLabel,
  MEMBER_AVATAR_SIZE,
  MEMBER_NAME_COLUMN_LABEL,
  MEMBER_SPLIT_KEY,
  TABLE_ID,
  type Row,
} from "../memberTable";
import { useMemberOps } from "../useMemberOps";

defineOptions({ name: "MemberTab" });

const props = withDefaults(defineProps<{ active?: boolean }>(), { active: true });
const memberOps = useMemberOps(toRef(props, "active"));
const memberStatusEnum = useMemberStatusEnum();
const statusToneOf = (status: string): "info" | "warning" | "danger" =>
  memberStatusTone(status) ?? "info";
const statusOptions = computed(() => withAllPickerOption(memberStatusEnum.getOptions()));
const statusFilter = computed({
  get: () => toStringPickerValue(memberOps.paging.condition.status),
  set: (value: string | number | boolean | null) => {
    memberOps.paging.condition.status = resolveStringPickerFilter(value);
    memberOps.refreshData();
  },
});
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (row: Row) => void }>();
const exportRef = ref<{ show: () => void }>();
const batchDeptRef = ref<{ show: (rows: Row[]) => void }>();
const selectedRows = ref<Row[]>([]);
const displayNameHeader = computed(() =>
  formatSelectionColumnLabel(MEMBER_NAME_COLUMN_LABEL, selectedRows.value.length),
);
const toolbarRow = {
  record: { id: "", status: MemberStatus.ACTIVE, departments: [] },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies Row;

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleImportExport = (): void => {
  exportRef.value?.show();
};
const handleChangeDept = (): void => {
  const targets = collectActiveMembers(selectedRows.value);
  if (targets.length === 0) {
    Message.warning("请先选择在职成员");
    return;
  }
  batchDeptRef.value?.show(targets);
};
const handleResign = (): void => {
  const targets = collectActiveMembers(selectedRows.value);
  if (targets.length === 0) {
    Message.warning("没有可离职的成员");
    return;
  }
  void privateResignMembers(targets);
};
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const handleSuspend = (item: Row): void => {
  Confirm.warning(
    `暂停只影响组织身份，不删除全局账号。是否暂停（${item.record.displayName || item.record.id}）？`,
  ).then(() => {
    TenantMemberStatusAPI(item.record.id, {
      expectedVersion: item.version,
      status: MemberStatus.SUSPENDED,
    }).then(() => {
      Message.success("已暂停");
      memberOps.refreshData();
    });
  });
};
const handleRestore = (item: Row): void => {
  Confirm.warning(`是否恢复组织成员（${item.record.displayName || item.record.id}）？`).then(() => {
    TenantMemberStatusAPI(item.record.id, {
      expectedVersion: item.version,
      status: MemberStatus.ACTIVE,
    }).then(() => {
      Message.success("已恢复");
      memberOps.refreshData();
    });
  });
};
const handleRemove = (item: Row): void => {
  Confirm.error(`移出不删除全局账号。是否移出（${item.record.displayName || item.record.id}）？`, {
    confirmButtonText: "移出",
  }).then(() => {
    TenantMemberRemoveAPI(item.record.id, { expectedVersion: item.version }).then(() => {
      Message.success("已移出");
      memberOps.refreshData();
    });
  });
};

const privateResignMembers = async (targets: Row[]): Promise<void> => {
  let ok = 0;
  let fail = 0;
  for (const item of targets) {
    try {
      await TenantMemberRemoveAPI(item.record.id, { expectedVersion: item.version });
      ok += 1;
    } catch {
      fail += 1;
    }
  }
  if (fail === 0) {
    Message.success(`已将 ${ok} 人操作离职`);
  } else {
    Message.warning(`成功 ${ok} 人，失败 ${fail} 人`);
  }
  if (ok > 0) {
    memberOps.refreshData();
  }
};

const toolbarActions = computed(() =>
  createToolbarActions({
    onCreate: handleCreate,
    onImportExport: handleImportExport,
    onChangeDept: handleChangeDept,
    onResign: handleResign,
    selectedCount: selectedRows.value.length,
  }),
);
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, {
    onDetail: handleDetail,
    onSuspend: handleSuspend,
    onRestore: handleRestore,
    onRemove: handleRemove,
  });

const privateOnSelectionChange = (rows: Row[]): void => {
  selectedRows.value = rows;
};

const privateOnColumnChange = (value: string[]): void => {
  memberOps.selectedColumnProps.value = value;
};

const refreshAll = (): void => {
  memberOps.refreshData();
  void memberOps.loadDepts();
};

onMounted(() => {
  void memberOps.loadDepts();
});

defineExpose({
  refreshDepts(): void {
    void memberOps.loadDepts();
  },
});
</script>

<style scoped lang="postcss">
:deep(.in-split-layout__left-scroll) {
  padding: var(--in-space-5);
  gap: 0;
}

.member-name {
  @apply flex items-center min-w-0;
  gap: var(--in-space-2);
}

.member-name__link {
  min-width: 0;
}

.member-name :deep(.in-button) {
  color: var(--in-text-color);
  font-weight: var(--in-font-weight-section-title);
}

.member-name :deep(.in-button:hover),
.member-name :deep(.in-button:focus-visible) {
  color: var(--in-color-primary);
}
</style>
