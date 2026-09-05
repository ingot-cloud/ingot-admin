<template>
  <in-page-frame v-loading="loading" mode="page">
    <template #header>
      <in-page-header show-back :description="detail.name" @back="privateOnBack">
        <template #action>
          <template v-if="currentTab === TabNameBase">
            <template v-if="editing">
              <in-button @click="privateOnCancel">取消</in-button>
              <in-button type="primary" :loading="loading" @click="privateOnConfirm">确定</in-button>
            </template>
            <in-button v-else type="primary" @click="privateOnEdit">编辑</in-button>
          </template>
        </template>
        <template #tabs>
          <in-biz-tabs-header v-model="currentTab" :tabs="tabs" />
        </template>
      </in-page-header>
    </template>

    <BasicInfoPanel
      v-show="currentTab === TabNameBase"
      ref="basicInfoPanelRef"
      v-model:editing="editing"
      :app-id="appId"
      @loaded="privateOnDetailLoaded"
    />
    <MenuPanel v-if="currentTab === TabNameMenu" ref="menuPanelRef" :app-id="appId" />
    <PermissionPanel
      v-if="currentTab === TabNamePermission"
      ref="permissionPanelRef"
      :app-id="appId"
      :app-code="detail.code"
    />
  </in-page-frame>
</template>

<script setup lang="ts">
import type { PlatformAppDetailVO } from "@/models";
import BasicInfoPanel from "./components/BasicInfoPanel.vue";
import MenuPanel from "./components/MenuPanel.vue";
import PermissionPanel from "./components/PermissionPanel.vue";

const props = defineProps<{
  appId: string;
}>();

const TabNameBase = "1";
const TabNameMenu = "2";
const TabNamePermission = "3";

const tabs = [
  { id: TabNameBase, title: "基本信息" },
  { id: TabNameMenu, title: "菜单" },
  { id: TabNamePermission, title: "权限" },
];

const TabQueryMap: Record<string, string> = {
  base: TabNameBase,
  menu: TabNameMenu,
  permission: TabNamePermission,
};

const basicInfoPanelRef = ref<InstanceType<typeof BasicInfoPanel>>();

const route = useRoute();

const currentTab = ref(TabQueryMap[route.query.tab as string] ?? TabNameBase);
const editing = ref(false);
const loading = ref(false);
const detail = reactive<PlatformAppDetailVO>({});

const message = useMessage();
const confirm = useMessageConfirm();
const go = useGo();

const privateOnDetailLoaded = (data: PlatformAppDetailVO): void => {
  Object.assign(detail, data);
};

const privateOnBack = (): void => {
  go({ path: "/platform/config/app/home" });
};

const privateOnEdit = (): void => {
  editing.value = true;
};

const privateOnCancel = (): void => {
  basicInfoPanelRef.value?.cancelEdit();
};

const privateOnConfirm = (): void => {
  confirm.warning(`确认保存应用(${detail.name})的修改?`).then(() => {
    basicInfoPanelRef.value
      ?.save()
      .then(() => {
        message.success("操作成功");
      })
      .catch((error: Error) => {
        if (error.message === "no changes") {
          message.warning("未改变数据");
        }
      });
  });
};
</script>
