<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header />
    </template>

    <in-split-layout>
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
              privateOnSearch();
            "
          >
            重置
          </in-button>
          <in-button type="primary" @in-click="privateOnSearch" :loading="treeQuery.isFetching.value">
            搜索
          </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="treeQuery.isFetching.value"
      :data="treeData"
      :headers="tableHeaders"
      @refresh="privateOnRefresh"
      ref="tableRef"
    >
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
    </in-split-layout>
  </in-page-frame>
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { PlatformPermission, PermissionTreeNode } from "@/models";
import { useOrgTypeEnums, useAuthorityTypeEnums } from "@/models/enums";
import type { TableAPI } from "@ingot/admin-core";
import {
  PlatformAuthorityTreeQueryOptions,
  platformPermissionQueryKeys,
} from "@/api/platform/config/authority.query";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const orgTypeEnums = useOrgTypeEnums();
const authorityTypeEnums = useAuthorityTypeEnums();
const message = useMessage();
const go = useGo();

const tableRef = ref<TableAPI>();
const queryClient = useQueryClient();
const filter = ref<PlatformPermission>({});
const submitted = ref<PlatformPermission>({});
const treeQuery = useQuery(() => PlatformAuthorityTreeQueryOptions(() => submitted.value));
const treeData = computed(() => treeQuery.data.value ?? []);

const privateOnSearch = (): void => {
  submitted.value = { ...filter.value };
};

const privateOnRefresh = (): void => {
  void queryClient.invalidateQueries({ queryKey: platformPermissionQueryKeys.trees() });
};

const privateGoAppDetail = (item: PermissionTreeNode): void => {
  if (!item.appId) {
    message.warning("该权限缺少关联应用，无法跳转");
    return;
  }
  go({ path: `/platform/config/app/detail/${item.appId}`, query: { tab: "permission" } });
};
</script>
