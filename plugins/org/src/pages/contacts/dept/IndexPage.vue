<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护组织部门、主管和编制。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="deptQuery.isFetching.value"
        :data="deptTree"
        :headers="visibleHeaders"
        :table-id="ORG_DEPT_TABLE_ID"
        density="compact"
        :expandRowKeys="expandRowKeys"
      >
        <template #title>
          <span>{{ userInforStore.getCurrentOrg?.name }}</span>
        </template>
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ORG_DEPT_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <in-button :disabled="item.mainFlag" link text @click="handleEdit(item)">
            {{ item.name }}
          </in-button>
        </template>
        <template #managerUsers="{ item }">
          <div
            flex
            flex-row
            gap-2
            flex-wrap
            v-if="item.managerUsers && item.managerUsers.length > 0"
          >
            <el-tag v-for="(it, index) in item.managerUsers" type="primary" :key="index">
              {{ it.nickname }}
            </el-tag>
          </div>
          <el-tag v-else type="info"> 暂无 </el-tag>
        </template>
        <template #status="{ item }">
          <in-common-status-tag :status="item.status" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <EditDrawer ref="EditDrawerRef" :selectData="deptTree" @success="privateRefresh" />
</template>

<script lang="ts" setup>
import {
  applyColumnSelection,
  Message,
  silentQueryRequest,
  useUserInfoStore,
  type InTableAction,
} from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO } from "@/models";
import { RemoveDeptAPI } from "@/api/org/dept";
import { OrgDeptTreeQueryOptions, orgDeptQueryKeys } from "@/api/org/dept.query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import EditDrawer from "./components/EditDrawer.vue";
import {
  createOrgDeptRowActions,
  createOrgDeptToolbarActions,
  ORG_DEPT_TABLE_ID,
  tableHeaders,
} from "./table";

const userInforStore = useUserInfoStore();
const queryClient = useQueryClient();
const deptQuery = useQuery(() => OrgDeptTreeQueryOptions());
const deptTree = computed(() => deptQuery.data.value ?? []);
const expandRowKeys = ref<Array<string>>([]);
const selectedColumnProps = ref<string[]>([]);
const toolbarRow = {} satisfies DeptTreeNodeWithManagerVO;

watch(
  deptTree,
  (data) => {
    if (data.length > 0 && expandRowKeys.value.length === 0) {
      expandRowKeys.value = [data[0].id!];
    }
  },
  { immediate: true },
);

const EditDrawerRef = ref();

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const removeMutation = useMutation({
  mutationFn: (id: string) => RemoveDeptAPI(id, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: orgDeptQueryKeys.all });
  },
});

const privateRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: orgDeptQueryKeys.all });
};

const handleRemove = (item: DeptTreeNodeWithManagerVO): void => {
  if (!item.id) {
    return;
  }
  removeMutation.mutateAsync(item.id).then(() => {
    Message.success("删除成功");
  });
};

const handleEdit = (data?: DeptTreeNodeWithManagerVO | string) => {
  EditDrawerRef.value.show(data || deptTree.value[0].id);
};

const toolbarActions = computed(() => createOrgDeptToolbarActions(() => handleEdit()));

const rowActionsOf = (
  item: DeptTreeNodeWithManagerVO,
): Array<InTableAction<DeptTreeNodeWithManagerVO>> =>
  createOrgDeptRowActions(item, {
    onEdit: handleEdit,
    onAddChild: (row) => handleEdit(row.id),
    onDelete: handleRemove,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
