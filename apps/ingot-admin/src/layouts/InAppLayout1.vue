<template>
  <el-container w-full h-full>
    <el-aside>
      <in-menu />
    </el-aside>

    <el-container>
      <el-header>
        <in-app-bar />
      </el-header>

      <in-tabs />

      <el-main>
        <router-view v-slot="{ Component }">
          <keep-alive :include="cacheNames">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import { useRouterStore } from "@/stores/modules/router";
const { cacheNames } = storeToRefs(useRouterStore());
</script>
<style lang="postcss" scoped>
.el-aside {
  @apply overflow-inherit box-border w-auto\! bg-[var(--in-menu-bg-color)] b-r b-r-[var(--in-menu-bg-color)] dark:b-r-[var(--in-border-color)];
}

.el-header {
  --el-header-padding: var(--in-app-bar-padding);
  --el-header-height: var(--in-app-bar-height);
  @apply flex items-center justify-between box-border dark:bg-[var(--in-bg-color)] b-b b-b-[var(--in-border-color)];
}

.el-main {
  @apply bg-[var(--in-bg-color-page)] box-border p-[var(--in-common-padding)] overflow-x-hidden;
  &::-webkit-scrollbar {
    @apply bg-[var(--in-bg-color-page)];
  }
}
</style>
