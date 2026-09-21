<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="成员与部门。账号与成员分离；对象操作看后端能力，脱敏值不回传。" />
    </template>
    <in-split-layout left-collapsible persistence-key="org-iam-members">
      <template #left>
        <div class="mb-8px flex flex-wrap gap-8px">
          <in-button size="small" @click="handleDeptCreate">新增部门</in-button>
          <in-button size="small" :disabled="!selectedDeptId" @click="handleDeptEdit">编辑</in-button>
          <in-button size="small" type="danger" :disabled="!selectedDeptId" @click="handleDeptDelete">
            删除
          </in-button>
        </div>
        <in-tree
          :data="deptTree"
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          highlight-current
          @node-click="privateOnDept"
        />
      </template>
      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="TABLE_ID"
        density="compact"
        :row-key="rowKeyOf"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template #tools-start>
          <el-input
            v-model="paging.condition.name"
            class="w-200px!"
            clearable
            placeholder="搜索成员"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #displayName="{ item }">
          <in-button text link @click="handleDetail(item)">
            {{ item.record.displayName || item.record.id }}
          </in-button>
        </template>
        <template #status="{ item }">{{ item.record.status }}</template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <MemberCreateDrawer ref="createRef" @success="refreshAll" />
  <MemberDetailDrawer ref="detailRef" @success="refreshData" />
  <DepartmentEditDrawer ref="deptRef" @success="refreshDepts" />
  <MemberExportDrawer ref="exportRef" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import { Confirm, Message, type InTableAction } from "@ingot/admin-core";
import { MemberStatus } from "@ingot/admin-common";
import { TenantDepartmentDeleteAPI, TenantMemberRemoveAPI, TenantMemberStatusAPI } from "@/api/iam/directory";
import MemberCreateDrawer from "./components/MemberCreateDrawer.vue";
import MemberDetailDrawer from "./components/MemberDetailDrawer.vue";
import DepartmentEditDrawer from "./components/DepartmentEditDrawer.vue";
import MemberExportDrawer from "./components/MemberExportDrawer.vue";
import { createRowActions, createToolbarActions, TABLE_ID, type Row } from "./table";
import { useOps } from "./useOps";

const {
  paging,
  deptTree,
  visibleHeaders,
  loadDepts,
  refreshData,
  privateOnDept: selectDept,
  rowKeyOf,
} = useOps();
const selectedDeptId = ref<string>();
const createRef = ref<{ show: () => void }>();
const detailRef = ref<{ show: (row: Row) => void }>();
const deptRef = ref<{ show: (options?: { id?: string; parentId?: string }) => void }>();
const exportRef = ref<{ show: () => void }>();
const toolbarRow = {
  record: { id: "", status: MemberStatus.ACTIVE, departments: [] },
  fieldAccess: {},
  capabilities: {},
  version: "",
} satisfies Row;

const privateOnDept = (node: { id?: string }): void => {
  selectedDeptId.value = node.id;
  selectDept(node);
};

const refreshDepts = (): void => {
  void loadDepts();
};

const refreshAll = (): void => {
  refreshData();
  refreshDepts();
};

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleExport = (): void => {
  exportRef.value?.show();
};
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const handleDeptCreate = (): void => {
  deptRef.value?.show({ parentId: selectedDeptId.value });
};
const handleDeptEdit = (): void => {
  if (!selectedDeptId.value) {
    return;
  }
  deptRef.value?.show({ id: selectedDeptId.value });
};
const handleDeptDelete = (): void => {
  if (!selectedDeptId.value) {
    return;
  }
  Confirm.error("只能删除空部门。是否删除当前部门？", { confirmButtonText: "删除" }).then(() => {
    TenantDepartmentDeleteAPI(selectedDeptId.value as string).then(() => {
      Message.success("已删除");
      selectedDeptId.value = undefined;
      refreshDepts();
    });
  });
};
const handleSuspend = (item: Row): void => {
  Confirm.warning(`暂停只影响组织身份，不删除全局账号。是否暂停（${item.record.displayName || item.record.id}）？`).then(
    () => {
      TenantMemberStatusAPI(item.record.id, {
        expectedVersion: item.version,
        status: MemberStatus.SUSPENDED,
      }).then(() => {
        Message.success("已暂停");
        refreshData();
      });
    },
  );
};
const handleRestore = (item: Row): void => {
  Confirm.warning(`是否恢复组织成员（${item.record.displayName || item.record.id}）？`).then(() => {
    TenantMemberStatusAPI(item.record.id, {
      expectedVersion: item.version,
      status: MemberStatus.ACTIVE,
    }).then(() => {
      Message.success("已恢复");
      refreshData();
    });
  });
};
const handleRemove = (item: Row): void => {
  Confirm.error(`移出不删除全局账号。是否移出（${item.record.displayName || item.record.id}）？`, {
    confirmButtonText: "移出",
  }).then(() => {
    TenantMemberRemoveAPI(item.record.id, { expectedVersion: item.version }).then(() => {
      Message.success("已移出");
      refreshData();
    });
  });
};

const toolbarActions = computed(() => createToolbarActions(handleCreate, handleExport));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, {
    onDetail: handleDetail,
    onSuspend: handleSuspend,
    onRestore: handleRestore,
    onRemove: handleRemove,
  });

onMounted(() => {
  void loadDepts();
});
</script>
