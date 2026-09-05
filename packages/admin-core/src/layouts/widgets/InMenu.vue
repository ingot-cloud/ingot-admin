<template>
  <nav
    class="in-menu select-none"
    :class="{
      'is-collapsed': !sidebarExpanded,
      'is-overlay': isOverlay,
    }"
    aria-label="主导航"
  >
    <div
      class="in-menu__scroll"
      data-testid="menu-scroll-viewport"
      @click.capture="privateOnMenuClick"
    >
      <el-scrollbar class="in-menu__scrollbar">
        <el-menu
          class="in-menu__list"
          :default-active="activePath"
          :collapse="false"
          :collapse-transition="false"
          :unique-opened="false"
          router
        >
          <in-submenu v-for="route in getMenus" :key="route.path" :route="route" />
        </el-menu>
      </el-scrollbar>
    </div>
    <div class="in-menu__clearance" aria-hidden="true"></div>
    <div class="in-menu__divider" aria-hidden="true"></div>
    <div class="in-menu__divider-gap" aria-hidden="true"></div>
    <button
      type="button"
      class="in-menu__control"
      :aria-label="controlLabel"
      :aria-expanded="sidebarExpanded || isOverlay"
      @click="privateToggle"
    >
      <in-icon :name="controlIcon" class="in-menu__control-icon" />
      <span v-if="showControlText" class="in-menu__control-text">{{ controlText }}</span>
    </button>
  </nav>
</template>

<script lang="ts" setup>
import { useAppStateStore } from "@/stores/modules/app";
import { useRouterStore } from "@/stores/modules/router";
import { getAdminRuntimeConfig } from "@/runtime";
import { shellLayoutKey } from "@/layouts/main/types";

defineOptions({
  name: "InMenu",
});

const router = useRouter();
const appStateStore = useAppStateStore();
const shell = inject(shellLayoutKey);
const { getMenuOpened } = storeToRefs(appStateStore);

const isOverlay = computed(() => shell?.isOverlay.value ?? false);
const sidebarExpanded = computed(() => {
  if (isOverlay.value) {
    return true;
  }
  return Boolean(getMenuOpened.value);
});
const showControlText = computed(() => isOverlay.value || sidebarExpanded.value);
const controlLabel = computed(() => {
  if (isOverlay.value) {
    return "关闭导航";
  }
  return sidebarExpanded.value ? "收起导航" : "展开导航";
});
const controlText = computed(() => (isOverlay.value ? "关闭导航" : "收起导航"));
const controlIcon = computed(() => {
  const prefix = getAdminRuntimeConfig().branding.symbol;
  return sidebarExpanded.value || isOverlay.value ? `${prefix}:ic_close` : `${prefix}:ic_expand`;
});

let lastActivePath = "/";
const activePath = computed(() => {
  const route = router.currentRoute.value;
  if (route.meta.hideMenu) {
    const matched = route.matched;
    if (matched.length > 1) {
      const parent = matched[matched.length - 2];
      return parent.children.find((item) => item.path === parent.redirect)?.path;
    }
    return lastActivePath;
  }
  lastActivePath = route.path;
  return route.path;
});

const { getMenus } = storeToRefs(useRouterStore());

const privateToggle = () => {
  if (shell) {
    if (isOverlay.value) {
      shell.closeOverlay();
      return;
    }
    shell.toggleSidebar();
    return;
  }
  appStateStore.toggleMenu();
};

const privateOnMenuClick = (event: MouseEvent) => {
  if (sidebarExpanded.value || isOverlay.value) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const groupTitle = target.closest(".el-sub-menu__title");
  if (groupTitle && !target.closest(".el-menu-item")) {
    event.preventDefault();
    event.stopPropagation();
  }
};
</script>

<style lang="postcss" scoped>
.in-menu {
  display: grid;
  grid-template-rows:
    minmax(0, 1fr) var(--in-menu-footer-clearance) 1px var(--in-menu-divider-gap)
    var(--in-menu-control-height) var(--in-sidebar-gutter);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--in-bg-color-sidebar);
  user-select: none;
}

.in-menu__scroll {
  min-height: 0;
  overflow: hidden;
}

.in-menu__scrollbar {
  height: 100%;
}

.in-menu__scrollbar :deep(.el-scrollbar__bar) {
  display: none;
}

.in-menu__scrollbar :deep(.el-scrollbar__wrap) {
  scrollbar-width: none;
}

.in-menu__scrollbar :deep(.el-scrollbar__wrap)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.in-menu__list {
  --el-menu-bg-color: var(--in-menu-bg-color);
  --el-menu-hover-bg-color: var(--in-menu-bg-hover-color);
  --el-menu-text-color: var(--in-menu-text-color);
  --el-menu-active-color: var(--in-menu-text-active-color);
  --el-menu-base-level-padding: var(--in-menu-base-level-padding);
  --el-menu-level-padding: var(--in-menu-level-padding);
  --el-menu-item-font-size: var(--in-menu-item-font-size);
  --el-menu-item-height: var(--in-menu-item-height);
  --el-menu-icon-width: var(--in-menu-icon-size);
  --in-menu-depth: 0;
  border-right: none;
  background: transparent;
  width: 100%;
  padding-top: var(--in-menu-content-padding-top);
}

.in-menu__clearance {
  min-height: var(--in-menu-footer-clearance);
}

.in-menu__divider {
  height: 1px;
  margin: 0 var(--in-space-2);
  background: var(--in-border-color);
}

.in-menu__divider-gap {
  min-height: var(--in-menu-divider-gap);
}

.in-menu__control {
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--in-menu-control-height);
  margin: 0;
  padding: 0 var(--in-menu-base-level-padding);
  border: 0;
  border-radius: var(--in-menu-control-radius);
  background: transparent;
  color: var(--in-text-color-secondary);
  cursor: pointer;
  gap: var(--in-space-3);
  justify-content: flex-start;
}

.in-menu.is-collapsed .in-menu__control {
  justify-content: center;
  padding: 0;
}

.in-menu__control-icon {
  width: var(--in-menu-icon-size);
  height: var(--in-menu-icon-size);
  flex: none;
  color: inherit;
  fill: currentColor;
}

.in-menu__control-text {
  font-size: var(--in-font-size-body);
  line-height: var(--in-menu-line-height);
  font-weight: 400;
  user-select: none;
  white-space: nowrap;
}

.in-menu__control:hover {
  background: var(--in-bg-color-control-hover);
}

.in-menu__control:active {
  background: var(--in-bg-color-active);
}

.in-menu__control:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-menu__control:disabled {
  color: var(--in-text-color-disabled);
  cursor: not-allowed;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: var(--in-menu-item-height);
  line-height: var(--in-menu-line-height);
  font-size: var(--in-menu-item-font-size);
  font-weight: var(--in-menu-item-font-weight);
  color: var(--in-menu-text-plain-color);
  border-radius: var(--in-menu-item-radius);
  margin-bottom: var(--in-menu-item-gap);
  user-select: none;
  padding-left: calc(
    var(--in-menu-base-level-padding) + min(1, var(--in-menu-depth, 0)) *
      (var(--in-menu-icon-size) + var(--in-menu-icon-gap)) + max(0, calc(var(--in-menu-depth, 0) - 1)) *
      var(--in-menu-nested-indent)
  ) !important;
}

:deep(.in-menu-node.has-icon:not(.is-active)),
:deep(.in-menu-node.has-icon:not(.is-active) > .el-sub-menu__title) {
  color: var(--in-menu-text-color);
}

:deep(.in-menu-node__icon),
:deep(.el-menu-item > .el-icon:not(.el-sub-menu__icon-arrow)),
:deep(.el-sub-menu__title > .el-icon:not(.el-sub-menu__icon-arrow)) {
  width: var(--in-menu-icon-size);
  height: var(--in-menu-icon-size);
  font-size: var(--in-menu-icon-size);
  margin-right: var(--in-menu-icon-gap);
  color: inherit;
  flex: none;
}

:deep(.in-menu-node__icon svg),
:deep(.el-menu-item .el-icon svg),
:deep(.el-sub-menu__title > .el-icon:not(.el-sub-menu__icon-arrow) svg) {
  width: var(--in-menu-icon-size);
  height: var(--in-menu-icon-size);
  display: block;
}

:deep(.el-menu-item span),
:deep(.el-sub-menu__title > span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-menu-item.is-active) {
  background: var(--in-bg-color-active);
  color: var(--in-menu-text-active-color);
  font-weight: var(--in-menu-item-font-weight-active);
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background: transparent;
  font-weight: var(--in-menu-item-font-weight);
  color: var(--in-menu-text-plain-color);
}

:deep(.el-sub-menu.has-icon.is-active > .el-sub-menu__title) {
  color: var(--in-menu-text-color);
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: var(--in-bg-color-menu-hover);
}

.is-collapsed :deep(.in-menu-node__icon),
.is-collapsed :deep(.el-menu-item > .el-icon),
.is-collapsed :deep(.el-sub-menu__title > .el-icon:not(.el-sub-menu__icon-arrow)) {
  margin-right: 0;
}

.is-collapsed :deep(.el-menu-item span),
.is-collapsed :deep(.el-sub-menu__title > span),
.is-collapsed :deep(.el-sub-menu__icon-arrow),
.is-collapsed :deep(.el-badge),
.is-collapsed :deep(.el-sub-menu .el-menu) {
  visibility: hidden;
  pointer-events: none;
  width: 0;
  height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.is-collapsed :deep(.el-sub-menu .el-menu) {
  display: none;
}

.is-collapsed :deep(.el-sub-menu__title) {
  pointer-events: none;
}

.is-collapsed :deep(.el-menu-item) {
  pointer-events: auto;
}

.is-collapsed :deep(.in-menu__divider) {
  background: transparent !important;
}
</style>
