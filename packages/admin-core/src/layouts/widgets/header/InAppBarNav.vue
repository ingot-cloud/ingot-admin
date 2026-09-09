<template>
  <div class="in-app-bar-nav" data-testid="app-bar-nav">
    <div ref="measureRef" class="in-app-bar-nav__measure" aria-hidden="true">
      <span
        v-for="item in items"
        :key="item.key"
        class="in-app-bar-nav__item"
        :data-nav-key="item.key"
      >
        <in-icon v-if="item.icon" :name="item.icon" class="in-app-bar-nav__icon" />
        <span class="in-app-bar-nav__label">{{ item.label }}</span>
        <in-icon v-if="item.type === InAdminHeaderItemType.Group" name="ep:arrow-down" class="in-app-bar-nav__caret" />
      </span>
      <span data-nav-more class="in-icon-button in-app-bar-nav__more-measure">
        <in-icon name="ep:more" class="in-app-bar__icon" />
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

    <button
      v-for="item in visibleItems"
      :key="item.key"
      :ref="(el) => privateSetEntryRef(item.key, el)"
      type="button"
      class="in-app-bar-nav__item"
      :class="{
        'is-active': item.key === effectiveActiveKey,
        'is-disabled': item.disabled,
        'is-open': item.type === InAdminHeaderItemType.Group && openGroupKey === item.key,
      }"
      :disabled="item.disabled"
      :aria-current="item.key === effectiveActiveKey ? 'page' : undefined"
      :aria-expanded="item.type === InAdminHeaderItemType.Group ? openGroupKey === item.key : undefined"
      :aria-haspopup="item.type === InAdminHeaderItemType.Group ? 'dialog' : undefined"
      @click="privateOnEntryClick(item)"
      @mouseenter="privateOnEntryEnter(item)"
      @mouseleave="privateOnEntryLeave(item)"
    >
      <in-icon v-if="item.icon" :name="item.icon" class="in-app-bar-nav__icon" />
      <span class="in-app-bar-nav__label">{{ item.label }}</span>
      <in-icon v-if="item.type === InAdminHeaderItemType.Group" name="ep:arrow-down" class="in-app-bar-nav__caret" />
    </button>

    <el-tooltip
      v-if="showMore"
      :disabled="moreOpen"
      content="更多"
      effect="light"
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
        <in-icon name="ep:more" class="in-app-bar__icon" />
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
        <div
          v-if="openGroup"
          class="in-app-bar-nav-panel"
          :class="{ 'is-single': groupPanelSingle }"
        >
          <section
            v-for="group in openGroup.groups"
            :key="group.key"
            class="in-app-bar-nav-panel__group"
          >
            <h3 class="in-app-bar-nav-panel__title">{{ group.title }}</h3>
            <div class="in-app-bar-nav-panel__items">
              <button
                v-for="entry in group.items"
                :key="entry.key"
                type="button"
                class="in-app-bar-nav-panel__item"
                :class="{ 'is-disabled': entry.disabled }"
                :disabled="entry.disabled"
                @click="privateOnGroupItemClick(openGroup.key, entry)"
              >
                <in-icon v-if="entry.icon" :name="entry.icon" class="in-app-bar-nav__icon" />
                <span>{{ entry.label }}</span>
              </button>
            </div>
          </section>
        </div>
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
      <div ref="navSlotTargetRef" class="in-app-bar-nav__slot-target"></div>
      <template v-if="!moreGroup">
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
          <in-icon v-if="item.icon" :name="item.icon" class="in-app-bar-nav__icon" />
          {{ item.label }}
        </button>
      </template>
      <template v-else>
        <section
          v-for="group in moreGroup.groups"
          :key="group.key"
          class="in-app-bar-nav-panel__group"
        >
          <h3 class="in-app-bar-nav-panel__title">{{ group.title }}</h3>
          <button
            v-for="entry in group.items"
            :key="entry.key"
            type="button"
            class="in-app-bar-overlay__item"
            :class="{ 'is-disabled': entry.disabled }"
            :disabled="entry.disabled"
            role="menuitem"
            @click="privateOnGroupItemClick(moreGroup.key, entry)"
          >
            <in-icon v-if="entry.icon" :name="entry.icon" class="in-app-bar-nav__icon" />
            {{ entry.label }}
          </button>
        </section>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import {
  InAdminHeaderItemType,
  InAdminHeaderNavGroupTrigger,
} from "@/plugin/header";
import type { ResolvedHeaderNavItem, ResolvedHeaderNavMenuItem } from "./resolveHeaderConfig";
import { useAppBarOverlay } from "./useAppBarOverlay";

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
}>();

const emit = defineEmits<{
  select: [payload: { entryKey: string; itemKey?: string }];
  "open-panel": [id: string];
  "close-panel": [];
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
  maxWidth: 720,
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

const groupPanelStyle = groupOverlay.panelStyle;
const morePanelStyle = moreOverlay.panelStyle;
const HOVER_CLOSE_MS = 160;
let groupCloseTimer = 0;

const privateUsesHover = (item: ResolvedHeaderNavItem): boolean =>
  item.type === InAdminHeaderItemType.Group &&
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
  if (item.disabled || item.type !== InAdminHeaderItemType.Group) {
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
  privateCancelGroupClose();
  openGroupKey.value = undefined;
  moreGroupKey.value = undefined;
  moreOverlay.privateClose(restore);
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
  if (item.type === InAdminHeaderItemType.Group) {
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
});

defineExpose({
  measureRef,
  slotRef,
  moreTriggerRef,
  focusMore: () => moreTriggerRef.value?.focus(),
});
</script>
<style lang="postcss" scoped>
.in-app-bar-nav {
  @apply flex items-center min-w-0 relative;
  flex: 1 1 auto;
  gap: 0;
}

.in-app-bar-nav__measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0;
  white-space: nowrap;
  left: 0;
  top: 0;
}

.in-app-bar-nav__item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
  max-width: 160px;
  margin: 0 var(--in-space-6) 0 0;
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
.in-app-bar-nav-panel__item.is-disabled,
.in-app-bar-overlay__item.is-disabled {
  color: var(--in-text-color-disabled);
  cursor: not-allowed;
}

.in-app-bar-nav__item:hover:not(.is-disabled):not(.is-active),
.in-app-bar-nav-panel__item:hover:not(.is-disabled),
.in-app-bar-overlay__item:hover:not(.is-disabled) {
  background: var(--in-bg-color-hover);
}

.in-app-bar-nav__item:focus-visible,
.in-app-bar-overlay__item:focus-visible,
.in-app-bar-nav-panel__item:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-app-bar-nav__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.in-app-bar-nav__icon,
.in-app-bar__icon {
  width: var(--in-app-bar-icon-size);
  height: var(--in-app-bar-icon-size);
  font-size: var(--in-app-bar-icon-size);
  flex: none;
  color: inherit;
}

.in-app-bar-nav__item :deep(svg) {
  width: var(--in-app-bar-icon-size);
  height: var(--in-app-bar-icon-size);
}

.in-app-bar-nav__extra,
.in-app-bar__entry {
  @apply flex items-center min-w-0;
  gap: var(--in-space-3);
}

.in-app-bar-nav__extra {
  margin-right: var(--in-space-6);
}

.in-app-bar-overlay {
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

.in-app-bar-overlay--nav .in-app-bar-nav-panel {
  width: max-content;
  max-width: 100%;
  max-height: none;
  overflow: visible;
}

.in-app-bar-overlay__toolbar {
  @apply flex items-center;
  gap: var(--in-space-2);
  padding: var(--in-space-2) var(--in-space-3);
  color: var(--in-text-color);
  font-weight: 500;
}

.in-app-bar-overlay__back,
.in-app-bar-overlay__item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--in-control-height);
  margin: 0;
  padding: 0 var(--in-space-3);
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  color: var(--in-text-color);
  cursor: pointer;
  gap: var(--in-space-2);
}

.in-app-bar-overlay__item.is-active {
  font-weight: var(--in-font-weight-section-title);
  color: var(--in-text-color);
  background: color-mix(in srgb, var(--in-text-color) 6%, transparent);
}

.in-app-bar-nav-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--in-space-8);
  padding: 0;
}

.in-app-bar-nav-panel.is-single {
  flex-direction: column;
  flex-wrap: nowrap;
  gap: var(--in-space-5);
}

.in-app-bar-nav-panel__group {
  flex: none;
  width: max-content;
  min-width: 0;
}

.in-app-bar-nav-panel__title {
  margin: 0;
  padding: 0 0 var(--in-space-2);
  border-bottom: 1px solid var(--in-border-color);
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-caption);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-caption);
  white-space: nowrap;
}

.in-app-bar-nav-panel__items {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--in-space-1);
  margin-top: var(--in-space-2);
}

.in-app-bar-nav-panel__item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: max-content;
  max-width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 4px 8px;
  border: 0;
  border-radius: var(--in-radius-card);
  background: transparent;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  cursor: pointer;
  gap: 6px;
  white-space: nowrap;
}

.in-app-bar-nav-panel__item .in-app-bar-nav__icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.in-app-bar-nav__caret {
  width: 12px;
  height: 12px;
  font-size: 12px;
  flex: none;
  color: var(--in-text-color-secondary);
}

.in-app-bar-nav__item.is-open:not(.is-active) {
  background: color-mix(in srgb, var(--in-text-color) 6%, transparent);
}

.in-app-bar-nav__item.is-open .in-app-bar-nav__caret {
  transform: rotate(180deg);
}
</style>
