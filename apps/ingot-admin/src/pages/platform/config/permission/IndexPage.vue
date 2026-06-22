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
      <template #code="{ item }">
        <in-button text link type="primary" @click="privateGoAppDetail(item)">
          <in-copy-tag :text="item.code" />
        </in-button>
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
        <in-button type="primary" text link @click="privateGoAppDetail(item)">
          <template #icon> <i-ep:edit /> </template>
          编辑
        </in-button>
      </template>
    </in-table>
  </in-filter-container>
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { PlatformPermission, PermissionTreeNode } from "@/models";
import { useOrgTypeEnums, useAuthorityTypeEnums } from "@/models/enums";
import type { TableAPI } from "@/components/table";
import { GetAuthorityTreeAPI } from "@/api/platform/config/authority.ts";

const orgTypeEnums = useOrgTypeEnums();
const authorityTypeEnums = useAuthorityTypeEnums();
const message = useMessage();
const go = useGo();

const loading = ref(false);
const tableRef = ref<TableAPI>();
const treeData = ref<Array<PermissionTreeNode>>([]);
const filter = ref<PlatformPermission>({});

const fetchData = (): void => {
  loading.value = true;
  GetAuthorityTreeAPI(filter.value)
    .then((response) => {
      treeData.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateGoAppDetail = (item: PermissionTreeNode): void => {
  if (!item.appId) {
    message.warning("该权限缺少关联应用，无法跳转");
    return;
  }
  go({ path: `/platform/config/app/detail/${item.appId}`, query: { tab: "permission" } });
};

onMounted(() => {
  fetchData();
});
</script>
