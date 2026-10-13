<template>
  <div class="in-app-bar-nav" data-testid="app-bar-nav">
    <div ref="measureRef" class="in-app-bar-nav__measure" aria-hidden="true">
      <span
        v-for="item in items"
        :key="item.key"
        class="in-app-bar-nav__item"
        :class="{ 'is-active': item.key === effectiveActiveKey }"
        :data-nav-key="item.key"
      >
        <InApplicationIcon v-if="item.icon" :icon="item.icon" class="in-app-bar-nav__icon" />
        <span class="in-app-bar-nav__label">{{ item.label }}</span>
        <in-icon
          v-if="item.type === InAdminHeaderNavItemType.Group"
          name="ep:arrow-down"
          class="in-app-bar-nav__caret"
        />
      </span>
      <span data-nav-application-more class="in-app-bar-nav__application-more">
        <in-icon name="ep:arrow-down" class="in-app-bar-nav__caret" />
      </span>
      <span data-nav-more class="in-icon-button in-app-bar-nav__more-measure">
        <icon-more-outlined class="in-app-bar__icon" />
      </span>
    </div>

    <Teleport :disabled="!overflowNavSlot" :to="navSlotTarget">
      <div
        v-if="hasNavSlot"
        ref="slotRef"
        class="in-app-bar-nav__extra"
        :class="{ 'is-overflow': overflowNavSlot }"
      >
        <slot name="header-start" />
        <slot name="nav" />
        <div v-if="slots['org-mgmt']" class="in-app-bar__entry">
          <slot name="org-mgmt" />
        </div>
        <div v-if="slots['product-settings']" class="in-app-bar__entry">
          <slot name="product-settings" />
        </div>
      </div>
    </Teleport>

    <template v-for="item in visibleItems" :key="item.key">
      <div
        v-if="item.key === applicationMoreKey"
        :ref="privateSetApplicationTrigger"
        class="in-app-bar-nav__application"
        :class="{ 'is-active': item.key === effectiveActiveKey, 'is-open': applicationOpen }"
        @mouseenter="privateOpenApplications"
        @mouseleave="privateScheduleApplicationClose"
      >
        <button
          type="button"
          class="in-app-bar-nav__item"
          :disabled="item.disabled"
          :aria-current="item.key === effectiveActiveKey ? 'page' : undefined"
          @click="privateOnEntryClick(item)"
        >
          <InApplicationIcon v-if="item.icon" :icon="item.icon" class="in-app-bar-nav__icon" />
          <span class="in-app-bar-nav__label">{{ item.label }}</span>
        </button>
        <button
          :ref="privateSetApplicationArrow"
          type="button"
          class="in-app-bar-nav__application-more"
          aria-label="更多应用"
          aria-haspopup="menu"
          :aria-expanded="applicationOpen"
          :aria-controls="applicationPanelId"
          @click="privateToggleApplications"
          @keydown.esc.prevent="privateCloseApplications(true)"
        >
          <in-icon name="ep:arrow-down" class="in-app-bar-nav__caret" />
        </button>
      </div>
      <button
        v-else
        :ref="(el) => privateSetEntryRef(item.key, el)"
        type="button"
        class="in-app-bar-nav__item"
        :class="{
          'is-active': item.key === effectiveActiveKey,
          'is-disabled': item.disabled,
          'is-open': item.type === InAdminHeaderNavItemType.Group && openGroupKey === item.key,
        }"
        :disabled="item.disabled"
        :aria-current="item.key === effectiveActiveKey ? 'page' : undefined"
        :aria-expanded="
          item.type === InAdminHeaderNavItemType.Group ? openGroupKey === item.key : undefined
        "
        :aria-haspopup="item.type === InAdminHeaderNavItemType.Group ? 'dialog' : undefined"
        @click="privateOnEntryClick(item)"
        @mouseenter="privateOnEntryEnter(item)"
        @mouseleave="privateOnEntryLeave(item)"
      >
        <InApplicationIcon v-if="item.icon" :icon="item.icon" class="in-app-bar-nav__icon" />
        <span class="in-app-bar-nav__label">{{ item.label }}</span>
        <in-icon
          v-if="item.type === InAdminHeaderNavItemType.Group"
          name="ep:arrow-down"
          class="in-app-bar-nav__caret"
        />
      </button>
    </template>

    <el-tooltip
      v-if="showMore && !applicationMoreKey"
      :disabled="moreOpen"
      content="更多"
      effect="dark"
      placement="bottom"
    >
      <button
        ref="moreTriggerRef"
        type="button"
        class="in-icon-button"
        aria-label="更多"
        :aria-expanded="moreOpen"
        aria-haspopup="menu"
        @click="privateToggleMore"
      >
        <icon-more-outlined class="in-app-bar__icon" />
      </button>
    </el-tooltip>

    <Teleport to="body">
      <div
        ref="groupPanelRef"
        class="in-app-bar-overlay in-app-bar-overlay--nav"
        :class="{ 'is-open': Boolean(openGroup), 'is-single': groupPanelSingle }"
        role="dialog"
        aria-label="分组菜单"
        tabindex="-1"
        :aria-hidden="!openGroup"
        :style="groupPanelStyle"
        @mouseenter="privateCancelGroupClose"
        @mouseleave="privateScheduleGroupClose"
        @keydown="privateOnGroupKeydown"
      >
        <InAppBarNavPanel
          v-if="openGroup"
          :groups="openGroup.groups"
          :single="groupPanelSingle"
          @select="privateOnGroupItemClick(openGroup.key, $event)"
        />
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        :id="applicationPanelId"
        ref="applicationPanelRef"
        class="in-app-bar-overlay in-app-bar-overlay--nav"
        :class="{ 'is-open': applicationOpen }"
        role="menu"
        aria-label="更多应用"
        tabindex="-1"
        :aria-hidden="!applicationOpen"
        :style="applicationPanelStyle"
        @mouseenter="privateCancelApplicationClose"
        @mouseleave="privateScheduleApplicationClose"
        @focusin="privateCancelApplicationClose"
        @focusout="privateOnApplicationFocusout"
        @keydown.esc.prevent="privateCloseApplications(true)"
      >
        <div ref="applicationSlotRef"></div>
        <InAppBarNavPanel
          v-if="applicationOpen"
          :groups="overflowApplicationGroups"
          :single="groupPanelSingle"
          :active-key="effectiveActiveKey"
          item-role="menuitem"
          @select="privateOnApplicationSelect"
        />
      </div>
    </Teleport>

    <div
      ref="morePanelRef"
      class="in-app-bar-overlay"
      :class="{ 'is-open': moreOpen }"
      role="menu"
      aria-label="更多导航"
      tabindex="-1"
      :aria-hidden="!moreOpen"
      :style="morePanelStyle"
      @keydown="privateOnMoreKeydown"
    >
      <div v-if="moreGroup" class="in-app-bar-overlay__toolbar">
        <button type="button" class="in-app-bar-overlay__back" @click="privateOnMoreBack">
          返回
        </button>
        <span>{{ moreGroup.label }}</span>
      </div>
      <Teleport :disabled="!applicationMoreKey" :to="applicationSlotRef ?? 'body'">
        <div ref="navSlotTargetRef" class="in-app-bar-nav__slot-target"></div>
      </Teleport>
      <template v-if="!moreGroup && !applicationMoreKey">
        <button
          v-for="item in overflowItems"
          :key="item.key"
          type="button"
          class="in-app-bar-overlay__item"
          :class="{
            'is-active': item.key === effectiveActiveKey,
            'is-disabled': item.disabled,
          }"
          :disabled="item.disabled"
          role="menuitem"
          @click="privateOnEntryClick(item)"
        >
          <InApplicationIcon v-if="item.icon" :icon="item.icon" class="in-app-bar-nav__icon" />
          {{ item.label }}
        </button>
      </template>
      <template v-else-if="moreGroup">
        <InAppBarNavPanel
          :groups="moreGroup.groups"
          single
          item-role="menuitem"
          @select="privateOnGroupItemClick(moreGroup.key, $event)"
        />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import InApplicationIcon from "./InApplicationIcon.vue";
import InAppBarNavPanel from "./InAppBarNavPanel.vue";
import { useId, type ComponentPublicInstance } from "vue";
import { InAdminHeaderNavItemType, InAdminHeaderNavGroupTrigger } from "@/plugin/header";
import {
  resolveNavGroupColumns,
  type ResolvedHeaderApplicationGroup,
  type ResolvedHeaderNavItem,
  type ResolvedHeaderNavMenuItem,
} from "./resolveHeaderConfig";
import { useAppBarOverlay } from "./useAppBarOverlay";
import IconMoreOutlined from "@/components/icons/IconMoreOutlined.vue";

defineOptions({
  name: "InAppBarNav",
});

const props = defineProps<{
  items: ResolvedHeaderNavItem[];
  visibleKeys: string[];
  overflowKeys: string[];
  showMore: boolean;
  overflowNavSlot: boolean;
  activeKey?: string;
  applicationMode?: boolean;
  applicationGroups?: ResolvedHeaderApplicationGroup[];
}>();

const emit = defineEmits<{
  select: [payload: { entryKey: string; itemKey?: string }];
  "open-panel": [id: string];
  "close-panel": [id?: string];
}>();

const slots = defineSlots<{
  nav?: () => unknown;
  "header-start"?: () => unknown;
  "org-mgmt"?: () => unknown;
  "product-settings"?: () => unknown;
}>();

const measureRef = ref<HTMLElement>();
const slotRef = ref<HTMLElement>();
const moreTriggerRef = ref<HTMLElement>();
const groupPanelRef = ref<HTMLElement>();
const morePanelRef = ref<HTMLElement>();
const navSlotTargetRef = ref<HTMLElement>();
const entryRefs = new Map<string, HTMLElement>();
const moreOpen = ref(false);
const applicationOpen = ref(false);
const applicationTriggerRef = ref<HTMLElement>();
const applicationArrowRef = ref<HTMLElement>();
const applicationPanelRef = ref<HTMLElement>();
const applicationSlotRef = ref<HTMLElement>();
const applicationPanelId = `app-bar-applications-${useId()}`;
const openGroupKey = ref<string>();
const moreGroupKey = ref<string>();
const groupTriggerRef = ref<HTMLElement>();

const hasNavSlot = computed(
  () =>
    Boolean(slots["header-start"]) ||
    Boolean(slots.nav) ||
    Boolean(slots["org-mgmt"]) ||
    Boolean(slots["product-settings"]),
);

const visibleItems = computed(() =>
  props.items.filter((item) => props.visibleKeys.includes(item.key)),
);
const overflowItems = computed(() =>
  props.items.filter((item) => props.overflowKeys.includes(item.key)),
);
const applicationMoreKey = computed(() =>
  props.applicationMode && props.showMore && overflowItems.value.length
    ? visibleItems.value[visibleItems.value.length - 1]?.key
    : undefined,
);
const overflowApplicationGroups = computed(() => {
  const keys = new Set(overflowItems.value.map((item) => item.key));
  return (props.applicationGroups ?? []).flatMap((group) => {
    const items = group.items.filter((item) => keys.has(item.key));
    return items.length
      ? [
          {
            ...group,
            items,
            columns: resolveNavGroupColumns(items.length, group.columns),
          },
        ]
      : [];
  });
});
const effectiveActiveKey = computed(() => {
  if (!props.activeKey) {
    return undefined;
  }
  return props.items.some((item) => item.key === props.activeKey) ? props.activeKey : undefined;
});
const openGroup = computed(() => props.items.find((item) => item.key === openGroupKey.value));
const moreGroup = computed(() => props.items.find((item) => item.key === moreGroupKey.value));
const groupOpen = computed({
  get: () => Boolean(openGroupKey.value),
  set: (value: boolean) => {
    if (!value) {
      openGroupKey.value = undefined;
    }
  },
});
const groupPanelSingle = useMediaQuery("(max-width: 767px)");
const navSlotTarget = computed(() => navSlotTargetRef.value ?? "body");

const groupOverlay = useAppBarOverlay({
  open: groupOpen,
  triggerRef: groupTriggerRef,
  panelRef: groupPanelRef,
  maxWidth: 1080,
  align: "start",
  offset: 8,
});

const moreOverlay = useAppBarOverlay({
  open: moreOpen,
  triggerRef: moreTriggerRef,
  panelRef: morePanelRef,
  align: "end",
  offset: 8,
});

const applicationOverlay = useAppBarOverlay({
  open: applicationOpen,
  triggerRef: applicationTriggerRef,
  panelRef: applicationPanelRef,
  maxWidth: 1080,
  align: "start",
  offset: 8,
});
const applicationPanelStyle = applicationOverlay.panelStyle;
const groupPanelStyle = groupOverlay.panelStyle;
const morePanelStyle = moreOverlay.panelStyle;
const HOVER_CLOSE_MS = 160;
let groupCloseTimer = 0;

let applicationCloseTimer = 0;

const privateSetApplicationTrigger = (el: Element | ComponentPublicInstance | null) => {
  applicationTriggerRef.value = el instanceof HTMLElement ? el : undefined;
};
const privateSetApplicationArrow = (el: Element | ComponentPublicInstance | null) => {
  applicationArrowRef.value = el instanceof HTMLElement ? el : undefined;
};

const privateCancelApplicationClose = () => {
  window.clearTimeout(applicationCloseTimer);
};
const privateCloseApplications = (restore = false) => {
  privateCancelApplicationClose();
  applicationOpen.value = false;
  if (restore) applicationArrowRef.value?.focus();
};
const privateScheduleApplicationClose = () => {
  privateCancelApplicationClose();
  applicationCloseTimer = window.setTimeout(() => {
    const focused = document.activeElement;
    if (focused && applicationPanelRef.value?.contains(focused)) return;
    privateCloseApplications();
  }, HOVER_CLOSE_MS);
};
const privateOpenApplications = () => {
  if (!applicationMoreKey.value) return;
  privateCancelApplicationClose();
  privateCancelGroupClose();
  openGroupKey.value = undefined;
  moreOpen.value = false;
  moreGroupKey.value = undefined;
  applicationOpen.value = true;
  emit("open-panel", "nav-applications");
  nextTick(() => applicationOverlay.privatePlacePanel());
};
const privateToggleApplications = () => {
  if (applicationOpen.value) {
    privateCloseApplications(true);
    return;
  }
  privateOpenApplications();
  nextTick(() => applicationPanelRef.value?.focus());
};
const privateOnApplicationFocusout = (event: FocusEvent) => {
  const target = event.relatedTarget;
  if (
    target instanceof Node &&
    (applicationTriggerRef.value?.contains(target) || applicationPanelRef.value?.contains(target))
  )
    return;
  privateScheduleApplicationClose();
};
const privateOnApplicationSelect = (item: ResolvedHeaderNavMenuItem) => {
  if (item.disabled) return;
  privateCloseAll(true);
  emit("select", { entryKey: item.key });
};

const privateUsesHover = (item: ResolvedHeaderNavItem): boolean =>
  item.type === InAdminHeaderNavItemType.Group &&
  item.trigger === InAdminHeaderNavGroupTrigger.Hover;

const privateCancelGroupClose = () => {
  window.clearTimeout(groupCloseTimer);
};

const privateScheduleGroupClose = () => {
  privateCancelGroupClose();
  groupCloseTimer = window.setTimeout(() => {
    if (!openGroupKey.value) {
      return;
    }
    openGroupKey.value = undefined;
    emit("close-panel");
  }, HOVER_CLOSE_MS);
};

const privateOpenGroup = (item: ResolvedHeaderNavItem) => {
  if (item.disabled || item.type !== InAdminHeaderNavItemType.Group) {
    return;
  }
  if (props.overflowKeys.includes(item.key)) {
    moreGroupKey.value = item.key;
    moreOpen.value = true;
    emit("open-panel", "nav-more");
    nextTick(() => moreOverlay.privatePlacePanel());
    return;
  }
  groupTriggerRef.value = entryRefs.get(item.key);
  moreOpen.value = false;
  moreGroupKey.value = undefined;
  openGroupKey.value = item.key;
  emit("open-panel", `nav-group:${item.key}`);
  nextTick(() => groupOverlay.privatePlacePanel());
};

const privateSetEntryRef = (key: string, el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement) {
    entryRefs.set(key, el);
    return;
  }
  entryRefs.delete(key);
};

const privateCloseAll = (restore = false) => {
  const applicationWasOpen = applicationOpen.value;
  const groupWasOpen = Boolean(openGroupKey.value);
  privateCloseApplications(restore && applicationWasOpen);
  if (restore && groupWasOpen) groupTriggerRef.value?.focus();
  privateCancelGroupClose();
  openGroupKey.value = undefined;
  moreGroupKey.value = undefined;
  moreOverlay.privateClose(restore && !applicationWasOpen && !groupWasOpen);
  emit("close-panel");
};

const privateOnEntryEnter = (item: ResolvedHeaderNavItem) => {
  if (item.disabled) {
    return;
  }
  if (privateUsesHover(item)) {
    privateCancelGroupClose();
    privateOpenGroup(item);
    return;
  }
  if (openGroup.value && privateUsesHover(openGroup.value)) {
    privateScheduleGroupClose();
  }
};

const privateOnEntryLeave = (item: ResolvedHeaderNavItem) => {
  if (privateUsesHover(item)) {
    privateScheduleGroupClose();
  }
};

const privateOnEntryClick = (item: ResolvedHeaderNavItem) => {
  if (item.disabled) {
    return;
  }
  if (item.type === InAdminHeaderNavItemType.Group) {
    if (privateUsesHover(item) && !props.overflowKeys.includes(item.key)) {
      if (openGroupKey.value !== item.key) {
        privateOpenGroup(item);
      }
      return;
    }
    if (props.overflowKeys.includes(item.key)) {
      moreGroupKey.value = item.key;
      moreOpen.value = true;
      emit("open-panel", "nav-more");
      nextTick(() => moreOverlay.privatePlacePanel());
      return;
    }
    groupTriggerRef.value = entryRefs.get(item.key);
    if (openGroupKey.value === item.key) {
      openGroupKey.value = undefined;
      emit("close-panel");
      return;
    }
    moreOpen.value = false;
    moreGroupKey.value = undefined;
    openGroupKey.value = item.key;
    emit("open-panel", `nav-group:${item.key}`);
    nextTick(() => groupOverlay.privatePlacePanel());
    return;
  }
  privateCloseAll();
  emit("select", { entryKey: item.key });
};

const privateOnGroupItemClick = (entryKey: string, entry: ResolvedHeaderNavMenuItem) => {
  if (entry.disabled) {
    return;
  }
  privateCloseAll(true);
  emit("select", { entryKey, itemKey: entry.key });
};

const privateToggleMore = () => {
  openGroupKey.value = undefined;
  if (moreOpen.value) {
    moreGroupKey.value = undefined;
    moreOverlay.privateClose(true);
    emit("close-panel");
    return;
  }
  emit("open-panel", "nav-more");
  moreOverlay.privateToggle();
};

const privateOnMoreBack = () => {
  moreGroupKey.value = undefined;
  nextTick(() => moreOverlay.privatePlacePanel());
};

const privateOnGroupKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    openGroupKey.value = undefined;
    groupOverlay.privateClose(true);
    emit("close-panel");
  }
};

const privateOnMoreKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    if (moreGroupKey.value) {
      privateOnMoreBack();
      return;
    }
    privateCloseAll(true);
  }
};

watch(applicationOpen, (open, previous) => {
  if (!open && previous) emit("close-panel", "nav-applications");
});
watch(
  () => [applicationMoreKey.value, props.overflowKeys, props.applicationGroups],
  () => {
    if (!applicationMoreKey.value) {
      privateCloseApplications();
      return;
    }
    nextTick(() => {
      if (applicationOpen.value) applicationOverlay.privatePlacePanel();
    });
  },
  { deep: true },
);

let applicationArrowHadFocus = false;
onBeforeUpdate(() => {
  applicationArrowHadFocus = document.activeElement === applicationArrowRef.value;
});
onUpdated(() => {
  if (applicationArrowHadFocus) applicationArrowRef.value?.focus();
});

watch(
  () => props.showMore,
  (show) => {
    if (!show && moreOpen.value) {
      privateCloseAll();
      moreTriggerRef.value?.blur();
    }
  },
);

onBeforeUnmount(() => {
  privateCancelGroupClose();
  privateCancelApplicationClose();
});

defineExpose({
  measureRef,
  slotRef,
  moreTriggerRef,
  focusMore: () =>
    (applicationMoreKey.value ? applicationArrowRef.value : moreTriggerRef.value)?.focus(),
  close: privateCloseAll,
});
</script>
<style lang="postcss" scoped>
.in-app-bar-nav {
  @apply flex items-center min-w-0 relative;
  flex: 1 1 auto;
  gap: var(--in-space-6);
}

.in-app-bar-nav__measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: var(--in-space-6);
  white-space: nowrap;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.in-app-bar-nav__measure > * {
  flex-shrink: 0;
}

.in-app-bar-nav__item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
  max-width: 160px;
  margin: 0;
  padding: 7px var(--in-space-3);
  border: 0;
  border-radius: var(--in-radius-card);
  background: transparent;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  white-space: nowrap;
  cursor: pointer;
  gap: 6px;
}

.in-app-bar-nav__item.is-active {
  font-weight: var(--in-font-weight-section-title);
  color: var(--in-text-color);
  background: color-mix(in srgb, var(--in-text-color) 6%, transparent);
}

.in-app-bar-nav__item.is-disabled,
.in-app-bar-overlay__item.is-disabled {
  color: var(--in-text-color-disabled);
  cursor: not-allowed;
}

.in-app-bar-nav__item:hover:not(.is-disabled):not(.is-active),
.in-app-bar-overlay__item:hover:not(.is-disabled) {
  background: var(--in-bg-color-hover);
}

.in-app-bar-nav__item:focus-visible,
.in-app-bar-overlay__item:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-app-bar-nav__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.in-app-bar-nav__icon {
  width: var(--in-app-bar-icon-size);
  height: var(--in-app-bar-icon-size);
  font-size: var(--in-app-bar-icon-size);
  flex: none;
  color: inherit;
}

.in-app-bar-nav__extra,
.in-app-bar__entry {
  @apply flex items-center min-w-0;
  gap: var(--in-space-3);
}

.in-app-bar-nav__application {
  @apply flex items-center min-w-0;
  max-width: 100%;
  border-radius: var(--in-radius-card);
}

.in-app-bar-nav__application.is-active,
.in-app-bar-nav__application.is-open,
.in-app-bar-nav__application:hover {
  background: color-mix(in srgb, var(--in-text-color) 6%, transparent);
}

.in-app-bar-nav__application.is-active .in-app-bar-nav__item {
  font-weight: var(--in-font-weight-section-title);
}

.in-app-bar-nav__application-more {
  @apply inline-flex items-center justify-center flex-none;
  box-sizing: border-box;
  width: 24px;
  height: var(--in-control-height);
  padding: 0 6px 0 0;
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  cursor: pointer;
}

.in-app-bar-nav__application .in-app-bar-nav__item:hover {
  background: transparent;
}

.in-app-bar-nav__application-more:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-app-bar-nav__application.is-open .in-app-bar-nav__caret {
  transform: rotate(180deg);
}

.in-app-bar-overlay {
  display: none;
  position: fixed;
  z-index: var(--in-z-dropdown);
  box-sizing: border-box;
  width: max-content;
  height: max-content;
  min-width: 160px;
  padding: var(--in-space-1);
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-overlay);
  visibility: hidden;
  pointer-events: none;
}

.in-app-bar-overlay.is-open {
  display: block;
  visibility: visible;
  pointer-events: auto;
}

.in-app-bar-overlay--nav {
  min-width: 0;
  padding: var(--in-space-4);
  overflow-x: hidden;
  overflow-y: auto;
}

.in-app-bar-overlay--nav.is-open::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: 8px;
}

.in-app-bar-nav__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  font-size: 12px;
  flex: none;
  color: var(--in-text-color-secondary);
  transform-origin: center;
  transition: transform var(--in-motion-duration) var(--in-motion-ease);
}

.in-app-bar-nav__item :deep(.in-app-bar-nav__caret svg) {
  width: 12px;
  height: 12px;
}

.in-app-bar-nav__item.is-open:not(.is-active) {
  background: color-mix(in srgb, var(--in-text-color) 6%, transparent);
}

.in-app-bar-nav__item.is-open .in-app-bar-nav__caret {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .in-app-bar-nav__caret {
    transition: none;
  }
}
</style>
