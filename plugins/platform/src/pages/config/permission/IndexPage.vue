<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查看平台权限树并跳转到应用详情。" />
    </template>

    <in-split-layout>
      <template #top>
        <in-filter-item>
          <in-with-label title="组织类型">
            <in-select
              class="w-200px"
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
            <in-button
              type="primary"
              @in-click="privateOnSearch"
              :loading="treeQuery.isFetching.value"
            >
              搜索
            </in-button>
          </template>
        </in-filter-item>
      </template>

      <in-table
        :loading="treeQuery.isFetching.value"
        :data="treeData"
        :headers="visibleHeaders"
        :table-id="PERMISSION_TABLE_ID"
        density="compact"
      >
        <template #summary>共 {{ treeData.length }} 个</template>
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="PERMISSION_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #code="{ item }">
          <in-button text link type="primary" @click="privateGoAppDetail(item)">
            <in-copy-tag :text="item.code" />
          </in-button>
        </template>
        <template #status="{ item }">
          <in-common-status-tag :status="item.status" />
        </template>
        <template #type="{ item }">
          <in-tag :value="authorityTypeEnums.getTagText(item.type)" />
        </template>
        <template #orgType="{ item }">
          <in-tag :value="orgTypeEnums.getTagText(item.orgType)" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { PlatformPermission, PermissionTreeNode } from "@/models";
import { useOrgTypeEnums, useAuthorityTypeEnums } from "@/models/enums";
import { PlatformAuthorityTreeQueryOptions } from "@/api/platform/config/authority.query";
import { createPermissionRowActions, PERMISSION_TABLE_ID, tableHeaders } from "./table";
import { useQuery } from "@tanstack/vue-query";

const orgTypeEnums = useOrgTypeEnums();
const authorityTypeEnums = useAuthorityTypeEnums();
const message = useMessage();
const go = useGo();

const filter = ref<PlatformPermission>({});
const submitted = ref<PlatformPermission>({});
const treeQuery = useQuery(() => PlatformAuthorityTreeQueryOptions(() => submitted.value));
const treeData = computed(() => treeQuery.data.value ?? []);
const selectedColumnProps = ref<string[]>([]);

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const privateOnSearch = (): void => {
  submitted.value = { ...filter.value };
};

const privateGoAppDetail = (item: PermissionTreeNode): void => {
  if (!item.appId) {
    message.warning("该权限缺少关联应用，无法跳转");
    return;
  }
  go({ path: `/platform/config/app/detail/${item.appId}`, query: { tab: "permission" } });
};

const rowActionsOf = (item: PermissionTreeNode): Array<InTableAction<PermissionTreeNode>> =>
  createPermissionRowActions(item, {
    onEdit: privateGoAppDetail,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
