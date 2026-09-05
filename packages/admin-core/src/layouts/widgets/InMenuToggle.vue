<template>
  <button
    v-if="isOverlay"
    type="button"
    class="in-icon-button menu-icon-container"
    :aria-label="overlayOpen ? '关闭导航' : '打开导航'"
    :aria-expanded="overlayOpen"
    @click="privateToggle"
  >
    <el-icon class="text-icon nav-menu-icon">
      <i-ep-expand />
    </el-icon>
  </button>
</template>
<script lang="ts" setup>
import { useAppStateStore } from "@/stores/modules/app";
import { shellLayoutKey } from "@/layouts/main/types";

defineOptions({
  name: "InMenuToggle",
});

const store = useAppStateStore();
const shell = inject(shellLayoutKey);
const isOverlay = computed(() => shell?.isOverlay.value ?? false);
const overlayOpen = computed(() => shell?.overlayOpen.value ?? false);

const privateToggle = () => {
  if (shell?.isOverlay.value) {
    shell.toggleSidebar();
    return;
  }
  store.toggleMenu();
};
</script>
<style scoped lang="postcss">
.menu-icon-container {
  & .nav-menu-icon {
    color: var(--in-text-color-secondary);
  }
}
</style>
