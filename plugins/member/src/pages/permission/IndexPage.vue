<template>
  <in-split-layout>
    <template #top>
      <in-filter-item>
        <in-with-label title="组织类型">
          <el-input
            v-model="filter.name"
            clearable
            style="width: 200px"
            placeholder="请输入权限名称"
          ></el-input>
        </in-with-label>
        <template #rightActions>
          <in-button @click="privateOnReset">重置</in-button>
          <in-button type="primary" @in-click="refreshData" :loading="treeQuery.isFetching.value">
            搜索
          </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="treeQuery.isFetching.value"
      :data="treeData"
      :headers="tableHeaders"
      @refresh="refreshData"
      ref="tableRef"
    >
      <template #title> 权限管理 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleCreate"> 添加权限 </in-button>
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #type="{ item }">
        <in-tag :value="authorityTypeEnums.getTagText(item.type)" />
      </template>
      <template #actions="{ item }">
        <in-button type="success" text link @click="handleEdit(item.id)">
          <template #icon>
            <i-carbon:parent-child />
          </template>
          添加子权限
        </in-button>
        <in-button type="primary" text link @click="handleEdit(item)">
          <template #icon> <i-ep:edit /> </template>
          编辑
        </in-button>
        <common-status-button
          text
          link
          :status="item.status"
          @click="handleToggleStatus(item)"
        />
      </template>
    </in-table>
  </in-split-layout>
  <EditDrawer ref="EditDrawerRef" :selectData="treeData" @success="refreshData" />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { MemberPermission, MemberPermissionTreeNodeVO } from "@/models";
import type { CommonStatus } from "@/models/enums";
import { useAuthorityTypeEnums, getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";
import EditDrawer from "./EditDrawer.vue";
import type { TableAPI } from "@ingot/admin-core";
import { UpdateAuthorityAPI } from "@/api/member/permission";
import {
  MemberPermissionTreeQueryOptions,
  memberPermissionQueryKeys,
} from "@/api/member/permission.query";
import { Confirm, Message, silentQueryRequest } from "@ingot/admin-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

const authorityTypeEnums = useAuthorityTypeEnums();
const EditDrawerRef = ref();
const tableRef = ref<TableAPI>();
const queryClient = useQueryClient();

const filter = reactive<MemberPermission>({});
const submitted = ref<MemberPermission>({});
const treeQuery = useQuery(() => MemberPermissionTreeQueryOptions(() => submitted.value));
const treeData = computed(() => treeQuery.data.value ?? []);

const refreshData = (): void => {
  submitted.value = { ...filter };
  void queryClient.invalidateQueries({ queryKey: memberPermissionQueryKeys.lists() });
};

const privateOnReset = (): void => {
  filter.name = undefined;
  refreshData();
};

const statusMutation = useMutation({
  mutationFn: (params: MemberPermission) => UpdateAuthorityAPI(params, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: memberPermissionQueryKeys.lists() });
  },
});

const handleToggleStatus = (item: MemberPermissionTreeNodeVO): void => {
  if (!item.id || !item.status) {
    return;
  }
  const next = getCommonStatusToggle(item.status as CommonStatus);
  Confirm.warning(`是否${getCommonStatusActionDesc(next)}权限(${item.name})`).then(() => {
    statusMutation.mutateAsync({ id: item.id, status: next }).then(() => {
      Message.success("操作成功");
    });
  });
};

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleEdit = (params: MemberPermission | string): void => {
  EditDrawerRef.value?.show(params);
};

onMounted(() => {
  refreshData();
});
</script>
