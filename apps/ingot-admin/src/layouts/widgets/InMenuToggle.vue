<template>
  <div class="menu-icon-container" @click="handleMenuIconClick">
    <el-icon class="text-icon cursor-pointer nav-menu-icon">
      <i-ep-expand v-if="!getMenuOpened" />
      <i-ep-fold v-else />
    </el-icon>
  </div>
</template>
<script lang="ts" setup>
import { useAppStateStore } from "@/stores/modules/app";

const store = useAppStateStore();

const { getMenuOpened } = storeToRefs(store);
const handleMenuIconClick = () => {
  store.toggleMenu();
};
</script>
<style scoped lang="postcss">
.menu-icon-container {
  height: var(--in-app-bar-height);
  width: var(--in-app-bar-height);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  & .nav-menu-icon {
    color: var(--in-color-primary);
  }
}
</style>
