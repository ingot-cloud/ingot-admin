<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header />
    </template>

    <in-split-layout>
    <template #header>
      <in-filter-item>
        <in-with-label title="角色名称">
          <el-input
            v-model="filter.name"
            clearable
            style="width: 200px"
            placeholder="请输入角色名称"
          ></el-input>
        </in-with-label>
        <template #rightActions>
          <in-button @click="filter.name && (filter.name = undefined)"> 重置 </in-button>
          <in-button type="primary" @in-click="refreshData" :loading="roleQuery.isFetching.value"> 搜索 </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="roleQuery.isFetching.value"
      :data="roleTree"
      ref="TableRef"
      :headers="tableHeaders"
      :expandRowKeys="roleTree.map((item) => item.id!)"
      @refresh="refreshData"
    >
      <template #toolbar>
        <in-button type="primary" @click="handleCreate()"> 添加角色 </in-button>
      </template>
      <template #name="{ item }">
        <in-button text link @click="handleEdit(item)">
          {{ item.name }}
        </in-button>
      </template>
      <template #code="{ item }">
        <el-tag>
          {{ item.code || "-" }}
        </el-tag>
      </template>
      <template #builtIn="{ item }">
        <el-tag :type="item.builtIn ? 'success' : 'info'">
          {{ item.builtIn ? "是" : "否" }}
        </el-tag>
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status"></common-status-tag>
      </template>
      <template #actions="{ item }">
        <in-button type="success" text link @click="handleEdit(item, true)">
          <template #icon>
            <i-carbon:parent-child />
          </template>
          添加子角色
        </in-button>
        <in-button text link type="primary" @click="handleEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
      </template>
    </in-table>

    <RoleDrawer ref="RoleDrawerRef" :roleList="roleTree" @success="refreshData" />
  </in-split-layout>
  </in-page-frame>
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { MemberRoleTreeNodeVO, MemberRole } from "@/models";
import type { TableAPI } from "@ingot/admin-core";
import { MemberRoleTreeQueryOptions, memberRoleQueryKeys } from "@/api/member/role.query";
import RoleDrawer from "./components/RoleDrawer.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const RoleDrawerRef = ref();
const TableRef = ref<TableAPI>();
const queryClient = useQueryClient();

const filter = reactive<MemberRole>({});
const submitted = ref<MemberRole>({});
const roleQuery = useQuery(() => MemberRoleTreeQueryOptions(() => submitted.value));
const roleTree = computed(() => roleQuery.data.value ?? []);

const refreshData = () => {
  submitted.value = { ...filter };
  void queryClient.invalidateQueries({ queryKey: memberRoleQueryKeys.lists() });
};

const handleCreate = (): void => {
  RoleDrawerRef.value.show();
};

const handleEdit = (params: MemberRoleTreeNodeVO, isAddChild: boolean = false): void => {
  RoleDrawerRef.value.show(params, isAddChild);
};

onMounted(() => {
  refreshData();
});
</script>
