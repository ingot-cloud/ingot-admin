<template>
  <div ref="hostRef" class="in-app-bar">
    <in-app-bar-brand
      ref="brandRef"
      :visible="header.brand.visible"
      :brand-component="header.brand.component"
      :navigation-mode="navigationMode"
      :overlay-open="overlayOpen"
      :compact="brandCompact"
      @toggle="toggleSidebar"
    >
      <template v-if="slots['brand-extra']" #brand-extra>
        <slot name="brand-extra" />
      </template>
    </in-app-bar-brand>

    <in-app-bar-nav
      ref="navRef"
      :items="header.navigation.items"
      :visible-keys="overflow.visibleNavKeys"
      :overflow-keys="overflow.overflowNavKeys"
      :show-more="overflow.showNavMore"
      :overflow-nav-slot="overflow.overflowNavSlot"
      :active-key="header.navigation.activeKey"
      @select="privateOnNavSelect"
      @open-panel="privateOpenPanel"
      @close-panel="privateOnPanelClose"
    >
      <template v-if="slots['header-start']" #header-start>
        <slot name="header-start" />
      </template>
      <template v-if="slots.nav" #nav>
        <slot name="nav" />
      </template>
      <template v-if="slots['org-mgmt']" #org-mgmt>
        <slot name="org-mgmt" />
      </template>
      <template v-if="slots['product-settings']" #product-settings>
        <slot name="product-settings" />
      </template>
    </in-app-bar-nav>

    <in-app-bar-search-pane
      ref="searchRef"
      :enabled="showSearch"
      :compact="overflow.searchCompact"
      :placeholder="header.search.placeholder"
      :search-component="header.search.component"
      @open-panel="privateOpenPanel"
      @close-panel="privateOnPanelClose"
    />

    <in-app-bar-utilities
      ref="utilitiesRef"
      :items="header.utilities"
      :visible-keys="overflow.visibleUtilityKeys"
      :overflow-keys="overflow.overflowUtilityKeys"
      :show-more="overflow.showUtilityMore"
      :overflow-utility-slot="overflow.overflowUtilitySlot"
      @open-panel="privateOpenPanel"
      @close-panel="privateOnPanelClose"
    >
      <template v-if="slots['header-end']" #header-end>
        <slot name="header-end" />
      </template>
      <template v-if="slots.utilities" #utilities>
        <slot name="utilities" />
      </template>
    </in-app-bar-utilities>

    <div ref="userRef" class="in-app-bar__user" data-testid="app-bar-user">
      <span
        v-if="showUserDivider"
        class="in-app-bar__divider"
        data-testid="app-bar-user-divider"
        aria-hidden="true"
      ></span>
      <in-user-dropdown
        :menu="header.user.menu"
        :compact="userCompact"
        :trigger="header.user.component"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { InAppBarUtilityAction } from "@/components/types";
import type { InAdminHeaderConfig } from "@/plugin/header";
import { useAppStateStore } from "@/stores/modules/app";
import { shellLayoutKey } from "@/layouts/main/types";
import InUserDropdown from "./user-dropdown/InUserDropdown.vue";
import {
  allocateHeaderOverflow,
  type HeaderOverflowResult,
} from "./header/allocateHeaderOverflow";
import InAppBarBrand from "./header/InAppBarBrand.vue";
import InAppBarNav from "./header/InAppBarNav.vue";
import InAppBarSearchPane from "./header/InAppBarSearchPane.vue";
import InAppBarUtilities from "./header/InAppBarUtilities.vue";
import { useResolvedHeader } from "./header/useResolvedHeader";

defineOptions({
  name: "InAppBar",
});

const props = defineProps<{
  header?: InAdminHeaderConfig;
  utilities?: InAppBarUtilityAction[];
}>();

const slots = defineSlots<{
  nav?: () => unknown;
  "header-start"?: () => unknown;
  "header-end"?: () => unknown;
  "brand-extra"?: () => unknown;
  "org-mgmt"?: () => unknown;
  "product-settings"?: () => unknown;
  utilities?: () => unknown;
}>();

const ICON_FALLBACK = 32;
const header = useResolvedHeader(
  () => props.header,
  () => props.utilities,
);
const appStateStore = useAppStateStore();
const shell = inject(shellLayoutKey);
const showSearch = computed(() => Boolean(appStateStore.getShowSearch));
const navigationMode = computed(() => shell?.navigationMode.value ?? "expanded");
const overlayOpen = computed(() => shell?.overlayOpen.value ?? false);
const isOverlay = computed(() => shell?.isOverlay.value ?? false);
const brandCompact = computed(() => isOverlay.value);
const userCompact = computed(() => header.value.user.compact || overflow.value.searchCompact);
const showUserDivider = computed(
  () =>
    header.value.utilities.length > 0 ||
    overflow.value.showUtilityMore ||
    overflow.value.overflowUtilitySlot ||
    Boolean(slots["header-end"]) ||
    Boolean(slots.utilities),
);
const toggleSidebar = () => {
  shell?.toggleSidebar();
};

const hostRef = ref<HTMLElement>();
const brandRef = ref<InstanceType<typeof InAppBarBrand>>();
const navRef = ref<InstanceType<typeof InAppBarNav>>();
const searchRef = ref<InstanceType<typeof InAppBarSearchPane>>();
const utilitiesRef = ref<InstanceType<typeof InAppBarUtilities>>();
const userRef = ref<HTMLElement>();
const openPanelId = ref<string>();
const lastNavSlotWidth = ref(0);
const lastUtilitySlotWidth = ref(0);
const overflow = ref<HeaderOverflowResult>({
  visibleNavKeys: [],
  overflowNavKeys: [],
  showNavMore: false,
  overflowNavSlot: false,
  searchCompact: false,
  visibleUtilityKeys: [],
  overflowUtilityKeys: [],
  showUtilityMore: false,
  overflowUtilitySlot: false,
});

const readPx = (value: string, fallback: number): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const elementOf = (target: { $el?: unknown } | undefined): HTMLElement | undefined => {
  const el = target?.$el;
  return el instanceof HTMLElement ? el : undefined;
};

const privateCollectNavWidths = (): Array<{ key: string; width: number }> => {
  const measure = navRef.value?.measureRef;
  return header.value.navigation.items.map((item) => {
    const node = measure?.querySelector(`[data-nav-key="${item.key.replace(/"/g, "")}"]`);
    const width = node instanceof HTMLElement ? node.getBoundingClientRect().width : 80;
    return { key: item.key, width };
  });
};

const privateMeasure = () => {
  const host = hostRef.value;
  if (!host) {
    return;
  }
  const gap = readPx(getComputedStyle(host).gap, 12);
  const hostWidth = host.getBoundingClientRect().width;
  const brandWidth = elementOf(brandRef.value)?.getBoundingClientRect().width ?? 0;
  const userWidth = userRef.value?.getBoundingClientRect().width ?? 0;
  const availableWidth = Math.max(
    0,
    hostWidth - brandWidth - userWidth - (brandWidth > 0 ? gap : 0) - (userWidth > 0 ? gap : 0),
  );
  const moreNode = navRef.value?.measureRef?.querySelector("[data-nav-more]");
  const moreButtonWidth =
    moreNode instanceof HTMLElement
      ? moreNode.getBoundingClientRect().width
      : ICON_FALLBACK;
  const navSlotEl = navRef.value?.slotRef;
  if (navSlotEl && !overflow.value.overflowNavSlot) {
    lastNavSlotWidth.value = navSlotEl.getBoundingClientRect().width;
  }
  const utilitySlotEl = utilitiesRef.value?.slotRef;
  if (utilitySlotEl && !overflow.value.overflowUtilitySlot) {
    lastUtilitySlotWidth.value = utilitySlotEl.getBoundingClientRect().width;
  }
  const searchFullWidth = readPx(
    getComputedStyle(host).getPropertyValue("--in-app-bar-search-width"),
    240,
  );
  const next = allocateHeaderOverflow({
    availableWidth,
    navItems: privateCollectNavWidths(),
    activeNavKey: header.value.navigation.activeKey,
    navSlotWidth: lastNavSlotWidth.value,
    searchEnabled: showSearch.value,
    searchFullWidth,
    searchCompactWidth: ICON_FALLBACK,
    utilityItems: header.value.utilities.map((item) => ({
      key: item.key,
      width: ICON_FALLBACK,
    })),
    utilitySlotWidth: lastUtilitySlotWidth.value,
    moreButtonWidth,
    itemGap: gap,
    navItemGap: readPx(getComputedStyle(host).getPropertyValue("--in-space-6"), 24),
    zoneGap: gap,
  });
  overflow.value = next;
};

let measureFrame = 0;
const privateSchedule = () => {
  cancelAnimationFrame(measureFrame);
  measureFrame = requestAnimationFrame(privateMeasure);
};

const privateOnNavSelect = (payload: { entryKey: string; itemKey?: string }) => {
  header.value.navigation.onSelect?.(payload);
};

const privateOpenPanel = (id: string) => {
  if (openPanelId.value && openPanelId.value !== id) {
    searchRef.value?.close();
    utilitiesRef.value?.close();
  }
  openPanelId.value = id;
};

const privateOnPanelClose = () => {
  openPanelId.value = undefined;
};

watch(
  header,
  (value) => {
    overflow.value.visibleNavKeys = value.navigation.items.map((item) => item.key);
    overflow.value.visibleUtilityKeys = value.utilities.map((item) => item.key);
    privateSchedule();
  },
  { immediate: true },
);

watch(
  () => [
    header.value.navigation.items.map((item) => item.key + item.label).join(),
    header.value.utilities.map((item) => item.key).join(),
    showSearch.value,
    navigationMode.value,
  ],
  () => privateSchedule(),
);

onMounted(() => {
  privateSchedule();
  void document.fonts?.ready.then(privateSchedule);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(measureFrame);
});

useResizeObserver(hostRef, privateSchedule);
useResizeObserver(() => elementOf(brandRef.value), privateSchedule);
useResizeObserver(userRef, privateSchedule);
</script>
<style lang="postcss" scoped>
.in-app-bar {
  @apply flex items-center w-full min-w-0;
  height: var(--in-app-bar-height);
  gap: var(--in-space-3);
}

.in-app-bar__user {
  @apply flex items-center;
  flex: none;
  gap: var(--in-space-3);
}

.in-app-bar__divider {
  width: 1px;
  height: var(--in-app-bar-icon-size);
  background: var(--in-border-color);
}
</style>
