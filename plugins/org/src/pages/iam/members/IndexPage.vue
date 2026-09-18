<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="成员与部门。账号与成员分离；对象操作看后端能力，脱敏值不回传。" />
    </template>
    <in-split-layout left-collapsible persistence-key="org-iam-members">
      <template #left>
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
        table-id="org-iam-members"
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
        <template #displayName="{ item }">
          {{ item.record.displayName || item.record.id }}
        </template>
        <template #status="{ item }">{{ item.record.status }}</template>
      </in-table>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import { applyColumnSelection, useCapabilities, useServerPaging } from "@ingot/admin-core";
import type { IamListQuery, MemberRecord, ResourceDetail } from "@ingot/admin-common";
import { TenantMemberPageQueryOptions } from "@/api/iam/directory.query";
import { TenantDepartmentPageAPI } from "@/api/iam/directory";
import { tableHeaders } from "./table";

const { unavailable } = useCapabilities();
const paging = useServerPaging<ResourceDetail<MemberRecord>, IamListQuery & { departmentId?: string }>({
  queryOptions: TenantMemberPageQueryOptions,
  enabled: () => !unavailable.value,
});
const selectedColumnProps = ref<string[]>([]);
const deptTree = ref<Array<{ id: string; name: string; children?: unknown[] }>>([]);

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));

const refreshData = (): void => {
  paging.search();
};

const loadDepts = (): void => {
  TenantDepartmentPageAPI({ current: 1, size: 200 }).then((response) => {
    deptTree.value = (response.data.records ?? []).map((item) => ({
      id: item.record.id,
      name: item.record.name,
    }));
  });
};

const privateOnDept = (node: { id?: string }): void => {
  paging.condition.departmentId = node.id;
  refreshData();
};

const rowKeyOf = (row: ResourceDetail<MemberRecord>): string => row.record.id;

onMounted(() => {
  loadDepts();
});
</script>
