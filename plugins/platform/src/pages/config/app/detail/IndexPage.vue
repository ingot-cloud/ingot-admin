<template>
  <in-container v-loading="loading" padding="0" :show-backtop="false">
    <div class="app-detail">
      <div class="detail-header">
        <div class="detail-header__left">
          <in-button text @click="privateOnBack">
            <template #icon>
              <i-ep:arrow-left />
            </template>
            返回
          </in-button>

          <el-divider direction="vertical" />

          <in-icon
            v-if="detail.icon"
            :name="detail.icon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />

          <span class="detail-header__name">{{ detail.name || "应用详情" }}</span>
        </div>
        <div v-if="currentTab === TabNameBase" class="detail-header__right">
          <template v-if="editing">
            <in-button @click="privateOnCancel">取消</in-button>
            <in-button type="primary" :loading="loading" @click="privateOnConfirm">确定</in-button>
          </template>
          <template v-else>
            <in-button type="primary" @click="privateOnEdit">编辑</in-button>
          </template>
        </div>
      </div>

      <div class="detail-tabs">
        <in-biz-tabs-header v-model="currentTab" :tabs="tabs" />
      </div>

      <div class="detail-panel">
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
      </div>
    </div>
  </in-container>
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

<style lang="postcss" scoped>
.app-detail {
  @apply h-full flex flex-col;
}

.detail-header {
  @apply flex-none flex flex-row items-center justify-between px-16px py-12px border-b border-[var(--in-border-color)] border-b-solid;

  & .detail-header__left {
    @apply flex flex-row items-center gap-2 flex-1;
  }

  & .detail-header__right {
    @apply flex flex-row items-center gap-2;
  }

  & .detail-header__name {
    @apply text-16px font-500 text-[var(--in-text-color-primary)];
  }
}

.detail-tabs {
  @apply flex-none border-b border-[var(--in-border-color)] border-b-solid;
}

.detail-panel {
  @apply flex-1 min-h-0 overflow-y-auto;
}
</style>
