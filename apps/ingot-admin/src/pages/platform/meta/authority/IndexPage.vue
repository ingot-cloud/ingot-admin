<template>
  <in-filter-container>
    <template #top>
      <in-filter-item>
        <in-with-label title="组织类型">
          <in-select
            style="width: 200px"
            v-model="filter.orgType"
            placeholder="请选择类型"
            :options="orgTypeEnums.getOptions()"
          />
        </in-with-label>
        <template #rightActions>
          <in-button
            @click="
              filter.orgType = undefined;
              fetchData();
            "
          >
            重置
          </in-button>
          <in-button type="primary" @in-click="fetchData" :loading="loading"> 搜索 </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="loading"
      :data="treeData"
      :headers="tableHeaders"
      @refresh="fetchData"
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
      <template #orgType="{ item }">
        <in-tag :value="orgTypeEnums.getTagText(item.orgType)" />
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
          @click="confirmStatus.exec(item.id, item.status, `权限(${item.name})`, '操作成功')"
        />
      </template>
    </in-table>
  </in-filter-container>
  <EditDrawer ref="EditDrawerRef" :selectData="selectData" @success="fetchData" />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { MetaPermission, PermissionTreeNode } from "@/models";
import { useOrgTypeEnums, useAuthorityTypeEnums } from "@/models/enums";
import EditDrawer from "./EditDrawer.vue";
import type { TableAPI } from "@/components/table";
import { GetAuthorityTreeAPI, UpdateAuthorityAPI } from "@/api/platform/meta/authority";

onMounted(() => {
  fetchData();
});

const orgTypeEnums = useOrgTypeEnums();
const authorityTypeEnums = useAuthorityTypeEnums();
const loading = ref(false);
const EditDrawerRef = ref();
const tableRef = ref<TableAPI>();
const treeData = ref<Array<PermissionTreeNode>>([]);
const selectData = ref([] as Array<PermissionTreeNode>);
const filter = ref<MetaPermission>({});

const fetchData = (): void => {
  loading.value = true;
  GetAuthorityTreeAPI(filter.value)
    .then((response) => {
      loading.value = false;
      treeData.value = response.data;
      selectData.value = response.data;
    })
    .catch(() => (loading.value = false));
};

const confirmStatus = useConfirmStatus(transformUpdateAPI(UpdateAuthorityAPI), fetchData);

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleEdit = (params: MetaPermission | string): void => {
  EditDrawerRef.value?.show(params);
};
</script>
