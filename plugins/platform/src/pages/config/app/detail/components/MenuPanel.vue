<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="menuData"
      :headers="visibleHeaders"
      :table-id="MENU_TABLE_ID"
      density="compact"
      row-key="id"
      default-expand-all
    >
      <template #tools-start>
        <in-table-column-setting
          :headers="menuTableHeaders"
          :table-id="MENU_TABLE_ID"
          @change="privateOnColumnChange"
        />
      </template>
      <template #tools-end>
        <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
      </template>
      <template #menuType="{ item }">
        <Icon :icon="getMenuTypeIcon(item.menuType)" />
      </template>
      <template #name="{ item }">
        <div flex flex-row items-center gap-2>
          <in-icon
            v-if="item.icon"
            :name="item.icon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />
          <in-button text link @click="privateOnEdit(item)">{{ item.name }}</in-button>
        </div>
      </template>
      <template #accessMode="{ item }">
        <in-tag-enum
          v-if="item.accessMode === AccessModeEnum.Open"
          :value="item.accessMode"
          :enumObj="accessModeEnum"
        />
        <span v-else>{{ permissionSummary(item) }}</span>
      </template>
      <template #path="{ item }">
        <in-copy-tag :text="item.path" />
      </template>
      <template #status="{ item }">
        <in-common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-table-actions :actions="rowActionsOf(item)" :row="item" />
      </template>
    </in-table>
  </div>

  <MenuEditDrawer
    ref="menuEditDrawerRef"
    :app-id="appId"
    :app-code="appCode"
    :select-data="menuData"
    @success="privateFetchData"
  />
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import { Icon } from "virtual:ingot-iconify-icon";
import type { MenuTreeNode } from "@/models";
import { getMenuTypeIcon, useAccessModeEnum, AccessModeEnum } from "@/models/enums";
import { AppMenuTreeQueryOptions } from "@/api/platform/config/app.query";
import { useQuery } from "@tanstack/vue-query";
import {
  createMenuRowActions,
  createMenuToolbarActions,
  MENU_TABLE_ID,
  menuTableHeaders,
} from "./menuTable";
import MenuEditDrawer from "./MenuEditDrawer.vue";

const props = defineProps<{
  appId: string;
  appCode?: string;
}>();

const accessModeEnum = useAccessModeEnum();

const permissionSummary = (item: MenuTreeNode): string => {
  const count = item.permissionIds?.length ?? 0;
  if (count === 0) {
    return "未关联权限";
  }
  return `已关联 ${count} 个权限`;
};

const menuQuery = useQuery(() => AppMenuTreeQueryOptions(() => props.appId));
const menuData = computed(() => menuQuery.data.value ?? []);
const loading = computed(() => menuQuery.isFetching.value);
const menuEditDrawerRef = ref<InstanceType<typeof MenuEditDrawer>>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: MenuTreeNode = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(menuTableHeaders, selectedColumnProps.value),
);

const privateFetchData = (): void => {
  void menuQuery.refetch();
};

const privateOnCreate = (): void => {
  menuEditDrawerRef.value?.show();
};

const privateOnAddChild = (item: MenuTreeNode): void => {
  menuEditDrawerRef.value?.show(item.id);
};

const privateOnEdit = (item: MenuTreeNode): void => {
  menuEditDrawerRef.value?.show(item);
};

const toolbarActions = computed(() => createMenuToolbarActions(privateOnCreate));

const rowActionsOf = (item: MenuTreeNode): Array<InTableAction<MenuTreeNode>> =>
  createMenuRowActions(item, {
    onDetail: privateOnEdit,
    onAddChild: privateOnAddChild,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

defineExpose({
  refresh: privateFetchData,
});
</script>

<style lang="postcss" scoped>
:deep(.in-table) {
  @apply p-0;
}
</style>
