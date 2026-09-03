<template>
  <el-container w-full h-full>
    <el-header>
      <in-app-bar />
    </el-header>

    <el-container>
      <el-aside>
        <in-menu />
      </el-aside>

      <el-container direction="vertical">
        <in-tabs v-if="appStateStore.getShowTabs" />
        <in-breadcrumb
          v-if="appStateStore.getShowBreadcrumb"
          class="m-l-[var(--in-common-margin)] m-t-[var(--in-common-margin)]"
        />
        <el-main>
          <router-view v-slot="{ Component }">
            <keep-alive :include="cacheNames">
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>

        <in-copyright v-if="appStateStore.getShowCopyright" />
      </el-container>
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import { useRouterStore } from "@/stores/modules/router";
import { useAppStateStore } from "@/stores/modules/app";

const appStateStore = useAppStateStore();
const { cacheNames } = storeToRefs(useRouterStore());
</script>
<style lang="postcss" scoped>
.el-aside {
  @apply overflow-inherit box-border w-auto\! bg-[var(--in-menu-bg-color)] b-r b-r-[var(--in-menu-bg-color)] dark:b-r-[var(--in-border-color)];
}

.el-header {
  --el-header-padding: var(--in-app-bar-padding);
  --el-header-height: var(--in-app-bar-height);
  @apply flex items-center justify-between box-border dark:bg-[var(--in-bg-color)];
  @apply b-b b-b-[var(--in-app-bar-bg)] dark:b-b-[var(--in-border-color)];
  background: var(--in-app-bar-bg);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.16);
  color: white;
}

.el-container {
  @apply bg-[var(--in-bg-color-page)];
  height: calc(100vh - var(--in-app-bar-height));
}

.el-main {
  @apply bg-[var(--in-bg-color-page)] box-border p-[var(--in-common-padding)] overflow-x-hidden;
  &::-webkit-scrollbar {
    @apply bg-[var(--in-bg-color-page)];
  }
}
</style>
