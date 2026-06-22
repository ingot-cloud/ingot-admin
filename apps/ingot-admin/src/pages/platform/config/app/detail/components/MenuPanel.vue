<template>
  <div class="p-10px">
    <in-table
      :loading="loading"
      :data="menuData"
      :headers="menuTableHeaders"
      row-key="id"
      default-expand-all
      @refresh="privateFetchData"
    >
      <template #toolbar>
        <in-button type="primary" @click="privateOnCreate">添加菜单</in-button>
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
        <in-copy-tag v-else :text="item.permissionCode" />
      </template>
      <template #path="{ item }">
        <in-copy-tag :text="item.path" />
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <div flex flex-row items-center justify-center gap-8px>
          <in-button type="success" text link @click="privateOnAddChild(item.id)">
            <template #icon>
              <i-carbon:parent-child />
            </template>
            添加子菜单
          </in-button>
          <in-button type="primary" text link @click="privateOnEdit(item)">
            <template #icon>
              <i-ep:edit />
            </template>
            编辑
          </in-button>
        </div>
      </template>
    </in-table>
  </div>

  <MenuEditDrawer
    ref="menuEditDrawerRef"
    :app-id="appId"
    :select-data="menuData"
    @success="privateFetchData"
  />
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { MenuTreeNode } from "@/models";
import {
  getMenuTypeIcon,
  useMenuTypeEnum,
  useAccessModeEnum,
  AccessModeEnum,
} from "@/models/enums";
import { AppMenuTreeAPI } from "@/api/platform/config/app.ts";
import { menuTableHeaders } from "./menuTable";
import MenuEditDrawer from "./MenuEditDrawer.vue";

const props = defineProps<{
  appId: string;
}>();

const menuTypeEnum = useMenuTypeEnum();
const accessModeEnum = useAccessModeEnum();

const loading = ref(false);
const menuData = ref<Array<MenuTreeNode>>([]);
const menuEditDrawerRef = ref<InstanceType<typeof MenuEditDrawer>>();

const privateFetchData = (): void => {
  if (!props.appId) {
    return;
  }
  loading.value = true;
  AppMenuTreeAPI(props.appId)
    .then((response) => {
      menuData.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateOnCreate = (): void => {
  menuEditDrawerRef.value?.show();
};

const privateOnAddChild = (pid: string): void => {
  menuEditDrawerRef.value?.show(pid);
};

const privateOnEdit = (item: MenuTreeNode): void => {
  menuEditDrawerRef.value?.show(item);
};

watch(
  () => props.appId,
  () => {
    privateFetchData();
  },
  { immediate: true },
);

defineExpose({
  refresh: privateFetchData,
});
</script>

<style lang="postcss" scoped>
:deep(.in-table) {
  @apply p-0;
}
</style>
