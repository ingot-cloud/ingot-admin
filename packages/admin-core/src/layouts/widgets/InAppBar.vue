<template>
  <div class="in-app-bar">
    <div class="in-app-bar__brand" data-testid="app-bar-brand">
      <el-tooltip
        v-if="isOverlay"
        :content="overlayOpen ? '关闭导航' : '打开导航'"
        effect="light"
        placement="bottom"
      >
        <button
          type="button"
          class="in-icon-button"
          :aria-label="overlayOpen ? '关闭导航' : '打开导航'"
          @click="toggleSidebar"
        >
          <in-icon name="ep:expand" class="in-app-bar__icon" />
        </button>
      </el-tooltip>
      <in-logo />
      <div v-if="slots['brand-extra']" class="in-app-bar__brand-extra">
        <slot name="brand-extra" />
      </div>
    </div>

    <div class="in-app-bar__nav" data-testid="app-bar-nav">
      <slot name="nav" />
      <div v-if="slots['org-mgmt']" class="in-app-bar__entry">
        <slot name="org-mgmt" />
      </div>
      <div v-if="slots['product-settings']" class="in-app-bar__entry">
        <slot name="product-settings" />
      </div>
    </div>

    <div class="in-app-bar__search-pane" data-testid="app-bar-search">
      <in-app-bar-search v-if="appStateStore.getShowSearch" class="in-app-bar__search" />
    </div>

    <div class="in-app-bar__actions" data-testid="app-bar-actions">
      <template v-for="item in extraUtilities" :key="item.key">
        <el-tooltip :content="item.label" effect="light" placement="bottom">
          <button
            type="button"
            class="in-icon-button"
            :aria-label="item.label"
            @click="item.onClick"
          >
            <in-icon v-if="item.icon" :name="item.icon" class="in-app-bar__icon" />
            <span v-if="item.badge != null" class="in-app-bar__badge">{{ item.badge }}</span>
          </button>
        </el-tooltip>
      </template>
      <slot name="utilities" />
      <el-tooltip v-if="showUtility('fullscreen')" content="全屏" effect="light" placement="bottom">
        <span>
          <in-fullscreen />
        </span>
      </el-tooltip>
      <el-tooltip v-if="showUtility('settings')" content="设置" effect="light" placement="bottom">
        <span>
          <in-global-setting />
        </span>
      </el-tooltip>

      <span class="in-app-bar__divider" aria-hidden="true"></span>

      <in-user-dropdown />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { InAppBarUtilityAction } from "@/components/types";
import { useAppStateStore } from "@/stores/modules/app";
import { shellLayoutKey } from "@/layouts/main/types";

const BUILTIN_KEYS = new Set(["fullscreen", "settings"]);

const props = withDefaults(
  defineProps<{
    utilities?: InAppBarUtilityAction[];
  }>(),
  {
    utilities: () => [],
  },
);

const slots = defineSlots<{
  nav?: () => unknown;
  "brand-extra"?: () => unknown;
  "org-mgmt"?: () => unknown;
  "product-settings"?: () => unknown;
  utilities?: () => unknown;
}>();

const appStateStore = useAppStateStore();
const shell = inject(shellLayoutKey);
const isOverlay = computed(() => shell?.isOverlay.value ?? false);
const overlayOpen = computed(() => shell?.overlayOpen.value ?? false);
const compact = useMediaQuery("(max-width: 1279px)");
const toggleSidebar = () => {
  shell?.toggleSidebar();
};

const visibleUtilities = computed(() => {
  return props.utilities.filter((item) => {
    if (item.featureFlag === false) {
      return false;
    }
    const implemented = Boolean(item.onClick) || BUILTIN_KEYS.has(item.key);
    if (!implemented) {
      return false;
    }
    if (compact.value && (item.priority ?? 0) < 40 && !BUILTIN_KEYS.has(item.key)) {
      return false;
    }
    return true;
  });
});

const extraUtilities = computed(() =>
  visibleUtilities.value.filter((item) => !BUILTIN_KEYS.has(item.key)),
);

const showUtility = (key: string) => {
  const configured = props.utilities.find((item) => item.key === key);
  if (configured?.featureFlag === false) {
    return false;
  }
  return true;
};
</script>
<style lang="postcss" scoped>
.in-app-bar {
  @apply flex items-center w-full min-w-0;
  height: var(--in-app-bar-height);
  gap: var(--in-space-3);
}

.in-app-bar__brand,
.in-app-bar__nav,
.in-app-bar__search-pane,
.in-app-bar__actions {
  @apply flex items-center min-w-0;
  gap: var(--in-space-3);
}

.in-app-bar__brand {
  flex: none;
}

.in-app-bar__nav {
  flex: 0 1 auto;
  width: max-content;
  max-width: var(--in-app-bar-nav-max);
  overflow-x: auto;
}

.in-app-bar__search-pane {
  flex: 1 1 0;
  justify-content: flex-end;
}

.in-app-bar__actions {
  flex: none;
  width: max-content;
  max-width: var(--in-app-bar-actions-max);
  overflow-x: auto;
}

.in-app-bar__icon {
  width: var(--in-app-bar-icon-size);
  height: var(--in-app-bar-icon-size);
}

.in-app-bar__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--in-color-danger);
  color: var(--in-text-color-inverse);
  font-size: 10px;
  line-height: 16px;
}

.in-app-bar__divider {
  width: 1px;
  height: var(--in-app-bar-icon-size);
  background: var(--in-border-color);
}

@media (max-width: 1023px) {
  .in-app-bar__nav {
    display: none;
  }
}
</style>
