<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="组织名称">
          <el-input
            v-model="paging.condition.name"
            class="item"
            clearable
            style="width: 200px"
            placeholder="请输入组织名称"
          ></el-input>
        </in-with-label>
        <template #rightActions>
          <in-button @click="paging.resetSubmitted({ name: undefined })"> 重置 </in-button>
          <in-button type="primary" @in-click="refreshData" :loading="paging.fetching.value">
            搜索
          </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="paging.fetching.value"
      :data="paging.pageInfo.value.records"
      :page="paging.pageInfo.value"
      ref="tableRef"
      :headers="tableHeaders"
      @handleSizeChange="paging.fetchData"
      @handleCurrentChange="paging.fetchData"
      @refresh="refreshData"
    >
      <template #title> 组织管理 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleCreate"> 添加组织 </in-button>
      </template>
      <template #name="{ item }">
        <div flex flex-row items-center gap-2>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          <in-button text link @click="handleEdit(item)">
            {{ item.name }}
          </in-button>
        </div>
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #orgType="{ item }">
        <in-tag :value="orgTypeEnums.getTagText(item.orgType)" />
      </template>
      <template #endAt="{ item }">
        <div v-if="item.endAt">
          <el-tag>{{ item.endAt }}</el-tag>
        </div>
        <el-tag v-else>无限期</el-tag>
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status"></common-status-tag>
      </template>
      <template #actions="{ item }">
        <in-button type="primary" text link @click="handleEdit(item)">
          <template #icon>
            <i-mdi:card-account-details-outline />
          </template>
          详情
        </in-button>
        <common-status-button
          :status="item.status"
          text
          link
          @click="handleToggleStatus(item)"
        />
      </template>
    </in-table>
  </in-filter-container>

  <EditDrawer ref="EditDrawerRef" @success="refreshData" />
  <CreateDrawer ref="CreateDrawerRef" @success="refreshData" />
</template>
<script lang="ts" setup>
import type { SysTenant } from "@/models";
import type { CommonStatus } from "@/models/enums";
import { tableHeaders } from "./table";
import EditDrawer from "./components/EditDrawer.vue";
import CreateDrawer from "./components/CreateDrawer.vue";
import { useOrgTypeEnums, getCommonStatusActionDesc, getCommonStatusToggle } from "@/models/enums";
import { TenantUpdateAPI } from "@/api/platform/org/tenant";
import { TenantPageQueryOptions, tenantQueryKeys } from "@/api/platform/org/tenant.query";
import { Confirm, Message, silentQueryRequest, useServerPaging } from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const orgTypeEnums = useOrgTypeEnums();
const CreateDrawerRef = ref();
const EditDrawerRef = ref();
const queryClient = useQueryClient();

const paging = useServerPaging<SysTenant, SysTenant>({
  queryOptions: TenantPageQueryOptions,
});

const statusMutation = useMutation({
  mutationFn: (params: SysTenant) => TenantUpdateAPI(params, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: tenantQueryKeys.lists() });
  },
});

const refreshData = () => {
  paging.search();
};

const handleCreate = (): void => {
  CreateDrawerRef.value?.show();
};

const handleEdit = (params: SysTenant): void => {
  EditDrawerRef.value?.show(params);
};

const handleToggleStatus = (item: SysTenant): void => {
  if (!item.id || !item.status) {
    return;
  }
  const next = getCommonStatusToggle(item.status as CommonStatus);
  Confirm.warning(`是否${getCommonStatusActionDesc(next)}组织(${item.name})`).then(() => {
    statusMutation.mutateAsync({ id: item.id, status: next }).then(() => {
      Message.success("操作成功");
    });
  });
};
</script>
