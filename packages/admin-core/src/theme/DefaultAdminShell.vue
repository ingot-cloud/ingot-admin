<template>
  <el-container class="in-shell" w-full h-full>
    <el-header v-if="slots.header" class="in-shell-header">
      <slot name="header" />
    </el-header>

    <el-container class="in-shell-workspace">
      <div
        v-if="isOverlay && overlayOpen"
        class="in-shell-mask"
        aria-hidden="true"
        @click="closeOverlay"
      />
      <el-aside v-if="slots.navigation" class="in-shell-aside" :class="asideClass">
        <slot name="navigation" />
      </el-aside>

      <el-container
        direction="vertical"
        class="in-shell-main"
        :class="{
          'has-breadcrumb': Boolean(slots.breadcrumb),
          'has-copyright': Boolean(slots.footer),
        }"
      >
        <div v-if="slots.breadcrumb" class="in-shell-breadcrumb">
          <slot name="breadcrumb" />
        </div>
        <slot name="content" />
        <slot name="footer" />
      </el-container>
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import { useAdminShell } from "./useAdminShell";

defineOptions({
  name: "DefaultAdminShell",
});

const slots = defineSlots<{
  header?: () => unknown;
  navigation?: () => unknown;
  breadcrumb?: () => unknown;
  content?: () => unknown;
  footer?: () => unknown;
}>();

const { isOverlay, overlayOpen, navigationMode, closeOverlay } = useAdminShell();

const asideClass = computed(() => ({
  "is-overlay": isOverlay.value,
  "is-overlay-open": isOverlay.value && overlayOpen.value,
  "is-collapsed": navigationMode.value === "collapsed",
}));
</script>
<style lang="postcss" scoped>
.in-shell {
  overflow: hidden;
  height: 100%;
}

.in-shell-workspace {
  @apply bg-[var(--in-bg-color-canvas)] relative min-w-0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  height: calc(100% - var(--in-app-bar-height));
}

.in-shell-aside {
  @apply box-border w-auto! bg-[var(--in-bg-color-sidebar)];
  width: calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-expanded)) !important;
  padding-left: var(--in-sidebar-gutter);
  overflow: hidden;
  border-right: 0;
  z-index: var(--in-z-sidebar);
  transition:
    width var(--in-motion-duration-sidebar) var(--in-motion-ease-sidebar),
    transform var(--in-motion-duration-sidebar) var(--in-motion-ease-sidebar);
}

.in-shell-aside.is-collapsed {
  width: calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-collapsed)) !important;
}

.in-shell-aside.is-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--in-z-overlay-sidebar);
  transform: translateX(-100%);
  width: calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-expanded)) !important;
  box-shadow: var(--in-shadow-overlay);
}

.in-shell-aside.is-overlay-open {
  transform: translateX(0);
}

.in-shell-mask {
  position: absolute;
  inset: 0;
  z-index: var(--in-z-overlay-mask);
  background: var(--in-overlay-mask);
}

.in-shell-main {
  @apply min-w-0 flex-1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.in-shell-breadcrumb {
  @apply flex items-center;
  flex: none;
  height: var(--in-page-breadcrumb-height);
  margin: 0;
  padding: 0 var(--in-page-gutter);
  background: var(--in-bg-color-canvas);
  color: var(--in-text-color-secondary);
}

.in-shell-main:not(.has-breadcrumb) :deep(.in-content-viewport__host) {
  padding-top: var(--in-page-gutter);
}
</style>
