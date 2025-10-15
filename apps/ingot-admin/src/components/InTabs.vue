<template>
  <div class="in-tabs">
    <el-tabs
      v-model="currentTab"
      type="card"
      @tab-click="handleTabClick"
      @tab-remove="handleRemove"
    >
      <el-tab-pane
        v-for="item in tabs"
        :key="item.path"
        :label="item.title"
        :name="item.path"
        :closable="item.close"
      >
      </el-tab-pane>
    </el-tabs>

    <div class="tabs-action">
      <el-dropdown trigger="click">
        <in-button class="btn" self-center>
          <el-icon>
            <i-ep-arrow-down />
          </el-icon>
        </in-button>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleAction(Action.Refresh)">
              <el-icon><i-ion:reload-sharp /></el-icon>重新加载
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="route.meta.isAffix"
              @click="handleAction(Action.CloseCurrent)"
            >
              <el-icon><i-clarity:close-line /></el-icon>关闭标签页
            </el-dropdown-item>
            <el-dropdown-item
              divided
              :disabled="!getCanCloseLeftTabs"
              @click="handleAction(Action.CloseLeft)"
            >
              <el-icon><i-line-md:arrow-close-left /></el-icon>关闭左侧标签页
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="!getCanCloseRightTabs"
              @click="handleAction(Action.CloseRight)"
            >
              <el-icon><i-line-md:arrow-close-right /></el-icon>关闭右侧标签页
            </el-dropdown-item>
            <el-dropdown-item
              divided
              :disabled="!getCanCloseOtherTabs"
              @click="handleAction(Action.CloseOther)"
            >
              <el-icon><i-dashicons:align-center /></el-icon>关闭其它标签页
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="!getCanCloseAllTabs"
              @click="handleAction(Action.CloseAll)"
            >
              <el-icon><i-clarity:minus-line /></el-icon>关闭全部标签页
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TabsPaneContext, TabPaneName } from "element-plus";
import { useTabsStore } from "@/stores/modules/tabs";

const route = useRoute();
const router = useRouter();
const tabsStore = useTabsStore();
const {
  tabs,
  getCanCloseLeftTabs,
  getCanCloseRightTabs,
  getCanCloseOtherTabs,
  getCanCloseAllTabs,
} = storeToRefs(tabsStore);
const currentTab = ref(route.path);

watch(
  () => route.path,
  () => {
    currentTab.value = route.path;
    // 隐藏的不添加
    if (route.meta.hideMenu) {
      return;
    }
    const tabItem = {
      icon: route.meta.icon as string,
      title: route.meta.title as string,
      path: route.path,
      close: !route.meta.isAffix,
    };
    tabsStore.addTab(tabItem);
  },
  {
    immediate: true,
  },
);

const handleTabClick = (tabItem: TabsPaneContext) => {
  const path = tabItem.props.name as string;
  router.push(path);
};

const handleRemove = (tabPath: TabPaneName) => {
  tabsStore.removeTab(tabPath as string, tabPath === route.path);
};

enum Action {
  Refresh = "0",
  CloseCurrent = "1",
  CloseLeft = "2",
  CloseRight = "3",
  CloseOther = "4",
  CloseAll = "5",
}

const handleAction = (action: Action) => {
  switch (action) {
    case Action.Refresh:
      tabsStore.refreshPage();
      break;
    case Action.CloseCurrent:
      tabsStore.removeTab(route.path);
      break;
    case Action.CloseLeft:
      tabsStore.closeToLeftTabs(route.path);
      break;
    case Action.CloseRight:
      tabsStore.closeToRightTabs(route.path);
      break;
    case Action.CloseOther:
      tabsStore.closeOtherTabs(route.path);
      break;
    case Action.CloseAll:
      tabsStore.closeAllTabs(route.path);
      break;
  }
};
</script>
<style lang="postcss">
.in-tabs {
  @apply flex items-center bg-[var(--in-bg-color)] b-b b-b-[var(--in-border-color)] b-l b-l-[var(--in-border-color)];
  & .tabs-action {
    @apply h-full flex;
    & .btn {
      @apply w-30px h-full rd-0 b-r-none b-t-none b-b-none b-l-[var(--in-border-color)];
    }
  }
  & .el-tabs {
    --el-tabs-header-height: var(--in-tabs-height);
    @apply p-b-5px p-t-5px flex-1;
    & .el-tabs__header {
      @apply box-border m-b-0 b-none;
      & .el-tabs__nav-prev {
        line-height: var(--in-tabs-height);
      }
      & .el-tabs__nav-next {
        line-height: var(--in-tabs-height);
      }
      & .el-tabs__nav {
        @apply b-none;
        & .el-tabs__item {
          @apply m-l-5px p-l-10px p-r-10px b b-[var(--in-tabs-border-color)];
          font-size: var(--in-tabs-font-size);
          /* &:not(.is-active) { */
          /* @apply b-none; */
          /* } */
        }
      }
    }
  }
}
</style>
