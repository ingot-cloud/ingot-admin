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
import { useOps } from "./useOps";

const { paging, deptTree, visibleHeaders, loadDepts, refreshData, privateOnDept, rowKeyOf } = useOps();

onMounted(() => {
  void loadDepts();
});
</script>
