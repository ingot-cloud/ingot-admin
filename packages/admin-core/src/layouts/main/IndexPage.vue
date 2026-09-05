<template>
  <el-container class="in-shell" w-full h-full>
    <el-header class="in-shell-header">
      <in-app-bar />
    </el-header>

    <el-container class="in-shell-workspace">
      <div
        v-if="isOverlay && overlayOpen"
        class="in-shell-mask"
        aria-hidden="true"
        @click="closeOverlay"
      />
      <el-aside class="in-shell-aside" :class="asideClass">
        <in-menu />
      </el-aside>

      <el-container
        direction="vertical"
        class="in-shell-main"
        :class="{
          'has-breadcrumb': breadcrumbVisible,
          'has-copyright': Boolean(appStateStore.getShowCopyright),
        }"
      >
        <in-tabs v-if="appStateStore.getShowTabs" />
        <in-breadcrumb v-if="breadcrumbVisible" class="in-shell-breadcrumb" />
        <el-main :ref="setContentRef" class="in-content-viewport">
          <div class="in-content-viewport__host">
            <router-view v-slot="{ Component }">
              <keep-alive :include="cacheNames">
                <component :is="Component" />
              </keep-alive>
            </router-view>
          </div>
        </el-main>

        <in-copyright v-if="appStateStore.getShowCopyright" />
      </el-container>
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import { useRouterStore } from "@/stores/modules/router";
import { useAppStateStore } from "@/stores/modules/app";
import { isBreadcrumbVisible } from "@/layouts/widgets/breadcrumb/buildBreadcrumbList";
import { shellLayoutKey } from "./types";
import { useShellLayout } from "./useShellLayout";
import { useContentScroll } from "./useContentScroll";

const route = useRoute();
const appStateStore = useAppStateStore();
const { cacheNames } = storeToRefs(useRouterStore());
const shell = useShellLayout();
const breadcrumbVisible = computed(() =>
  isBreadcrumbVisible(appStateStore.getShowBreadcrumb, route.matched),
);
const { isOverlay, overlayOpen, navigationMode, closeOverlay } = shell;
provide(shellLayoutKey, shell);

const contentRef = ref<HTMLElement>();
const setContentRef = (el: unknown) => {
  if (el && typeof el === "object" && "$el" in el) {
    contentRef.value = (el as { $el: HTMLElement }).$el;
    return;
  }
  contentRef.value = el instanceof HTMLElement ? el : undefined;
};
useContentScroll(contentRef);

const asideClass = computed(() => ({
  "is-overlay": isOverlay.value,
  "is-overlay-open": isOverlay.value && overlayOpen.value,
  "is-collapsed": navigationMode.value === "collapsed",
}));

const privateOnKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeOverlay();
  }
};

onMounted(() => {
  window.addEventListener("keydown", privateOnKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", privateOnKeydown);
});
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

.in-content-viewport {
  @apply bg-[var(--in-bg-color-canvas)] box-border min-w-0 flex flex-col;
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.in-content-viewport__host {
  @apply flex flex-col min-w-0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--in-page-gutter);
}

.in-shell-main:not(.has-breadcrumb) .in-content-viewport__host {
  padding-top: var(--in-page-gutter);
}

.in-content-viewport__host > :deep(*) {
  flex: 1;
  min-height: 0;
  max-height: 100%;
}

.in-content-viewport__host > :deep(:not(.in-page-frame):not(.in-filter-container)) {
  overflow: auto;
  padding-bottom: var(--in-page-gutter);
  box-sizing: border-box;
}
</style>
