<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查看平台菜单树并跳转到应用详情。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="treeQuery.isFetching.value"
        :data="menuData"
        :headers="visibleHeaders"
        :table-id="MENU_TABLE_ID"
        density="compact"
      >
        <template #summary>共 {{ menuData.length }} 个</template>
        <template #tools-start>
          <in-picker v-model="orgTypeFilter" label="组织类型" :options="orgTypeFilterOptions" />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="MENU_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #name="{ item }">
          <in-button text link type="primary" @click="privateGoAppDetail(item)">
            {{ item.name }}
          </in-button>
        </template>
        <template #menuType="{ item }">
          <Icon mr-2 :icon="getMenuTypeIcon(item.menuType)" />
          {{ menuTypeEnums.getTagText(item.menuType).text }}
        </template>
        <template #path="{ item }">
          <in-copy-tag :text="item.path" />
        </template>
        <template #accessMode="{ item }">
          <in-tag-enum :value="item.accessMode" :enumObj="accessModeEnums" />
        </template>
        <template #permissionCode="{ item }">
          <in-copy-tag
            v-if="item.accessMode === AccessModeEnum.Permission"
            :text="item.permissionCode || '-'"
          />
          <el-tag v-else type="success">开放</el-tag>
        </template>
        <template #icon="{ item }">
          <in-icon
            v-if="item.icon"
            :name="item.icon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />
          <span v-else>-</span>
        </template>
        <template #hidden="{ item }">
          <el-tag :type="item.hidden ? 'danger' : 'success'">
            {{ item.hidden ? "是" : "否" }}
          </el-tag>
        </template>
        <template #hideBreadcrumb="{ item }">
          <el-tag :type="item.hideBreadcrumb ? 'danger' : 'success'">
            {{ item.hideBreadcrumb ? "是" : "否" }}
          </el-tag>
        </template>
        <template #isCache="{ item }">
          <el-tag :type="item.isCache ? 'danger' : 'success'">
            {{ item.isCache ? "是" : "否" }}
          </el-tag>
        </template>
        <template #props="{ item }">
          <el-tag :type="item.props ? 'danger' : 'success'">
            {{ item.props ? "是" : "否" }}
          </el-tag>
        </template>
        <template #linkType="{ item }">
          <in-tag-enum :value="item.linkType" :enumObj="menuLinkTypeEnums" />
        </template>
        <template #orgType="{ item }">
          <in-tag-enum :value="item.orgType" :enumObj="orgTypeEnums" />
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
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction, withAllPickerOption } from "@ingot/admin-core";
import { Icon } from "@iconify/vue";
import {
  AccessModeEnum,
  getMenuTypeIcon,
  useAccessModeEnum,
  useMenuTypeEnum,
  useOrgTypeEnums,
  useMenuLinkTypeEnum,
} from "@/models/enums";
import { createMenuRowActions, MENU_TABLE_ID, tableHeaders } from "./table";
import type { MenuTreeNode, PlatformMenu } from "@/models";
import { PlatformMenuTreeQueryOptions } from "@/api/platform/config/menu.query";
import { useQuery } from "@tanstack/vue-query";

const menuTypeEnums = useMenuTypeEnum();
const orgTypeEnums = useOrgTypeEnums();
const menuLinkTypeEnums = useMenuLinkTypeEnum();
const accessModeEnums = useAccessModeEnum();

const message = useMessage();
const go = useGo();

const filter = ref<PlatformMenu>({});
const submitted = ref<PlatformMenu>({});
const treeQuery = useQuery(() => PlatformMenuTreeQueryOptions(() => submitted.value));
const menuData = computed(() => treeQuery.data.value ?? []);
const selectedColumnProps = ref<string[]>([]);
const orgTypeFilterOptions = computed(() => withAllPickerOption(orgTypeEnums.getOptions()));
const orgTypeFilter = computed({
  get: (): string => filter.value.orgType ?? "",
  set: (value: string | number | boolean | null) => {
    filter.value.orgType = typeof value === "string" && value !== "" ? value : undefined;
    privateOnSearch();
  },
});

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const privateOnSearch = (): void => {
  submitted.value = { ...filter.value };
};

const privateGoAppDetail = (item: MenuTreeNode): void => {
  if (!item.appId) {
    message.warning("该菜单缺少关联应用，无法跳转");
    return;
  }
  go({ path: `/platform/config/app/detail/${item.appId}`, query: { tab: "menu" } });
};

const rowActionsOf = (item: MenuTreeNode): Array<InTableAction<MenuTreeNode>> =>
  createMenuRowActions(item, {
    onEdit: privateGoAppDetail,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>
