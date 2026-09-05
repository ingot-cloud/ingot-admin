<template>
  <div
    ref="rootRef"
    class="in-filter-container"
    :class="[
      `is-${variant}`,
      `is-${density}`,
      {
        'has-left': Boolean(slot.left),
        'is-left-open': leftVisible,
        'is-left-collapsed': Boolean(slot.left) && !leftVisible,
        'is-left-overlay': isOverlay,
        'is-left-overlay-open': isOverlay && overlayOpen,
      },
    ]"
    :style="rootStyle"
  >
    <div
      v-if="slot.header"
      class="in-filter-container-header"
      :class="{ 'sticky-header': stickyHeader }"
    >
      <slot name="header"></slot>
    </div>

    <div class="in-filter-container-left-right">
      <div
        v-if="isOverlay && overlayOpen"
        class="in-filter-container__mask"
        aria-hidden="true"
        @click="privateCloseOverlay"
      />

      <aside
        v-if="slot.left"
        class="left-filter"
        :class="{ 'is-collapsed': !leftVisible }"
        :aria-hidden="!leftVisible"
      >
        <div class="left-filter__scroll">
          <slot name="left"></slot>
        </div>
      </aside>

      <el-tooltip
        v-if="slot.left && leftCollapsible"
        :content="collapseLabel"
        effect="light"
        placement="right"
      >
        <button
          type="button"
          class="in-filter-container__collapse"
          :class="{ 'is-collapsed': !leftVisible }"
          :aria-label="collapseLabel"
          @click="privateToggleLeft"
        >
          <in-icon name="ep:arrow-left" class="in-filter-container__collapse-icon" />
        </button>
      </el-tooltip>

      <el-container class="in-filter-container-right">
        <div class="top-filter" v-if="slot.top">
          <slot name="top"></slot>
        </div>

        <div class="inner-container">
          <slot />
        </div>
      </el-container>
    </div>

    <el-backtop v-if="showBacktop" :target="backtopTarget" :right="60" :bottom="60">
      <div flex items-center justify-center>
        <i-material-symbols:vertical-align-top-rounded />
      </div>
    </el-backtop>
  </div>
</template>

<script lang="ts" setup>
import type { InDensity, InSurfaceVariant } from "../types";
import { SHELL_BREAKPOINT_NARROW } from "@/layouts/main/types";
import { useUserInfoStore } from "@/stores/modules/auth";
import {
  buildUiPreferenceKey,
  FILTER_LEFT_STORAGE_PREFIX,
  readUiPreference,
  resolveUiUserKey,
  writeUiPreference,
} from "@/utils/uiPreference";

defineOptions({
  name: "InFilterContainer",
});

const props = withDefaults(
  defineProps<{
    showBacktop?: boolean;
    stickyHeader?: boolean;
    variant?: InSurfaceVariant;
    density?: InDensity;
    backtopTarget?: string;
    leftWidth?: number;
    leftCollapsible?: boolean;
    autoCollapse?: boolean;
    minRightWidth?: number;
    persistenceKey?: string;
    radius?: string;
    background?: string;
    leftBackground?: string;
    borderColor?: string;
    borderWidth?: string;
  }>(),
  {
    showBacktop: false,
    stickyHeader: true,
    variant: "plain",
    density: "default",
    backtopTarget: ".in-table__body",
    leftWidth: 260,
    leftCollapsible: true,
    autoCollapse: true,
    minRightWidth: 680,
  },
);

const leftOpen = defineModel<boolean>("leftOpen", { default: true });
const slot = useSlots();
const userStore = useUserInfoStore();
const overlayQuery = useMediaQuery(`(max-width: ${SHELL_BREAKPOINT_NARROW - 1}px)`);
const overlayOpen = ref(false);
const rootRef = ref<HTMLElement>();
const containerWidth = ref(Number.POSITIVE_INFINITY);
const userForcedOpen = ref(false);

const isOverlay = computed(() => Boolean(slot.left) && props.leftCollapsible && overlayQuery.value);
const autoShouldCollapse = computed(() => {
  if (!props.leftCollapsible || !props.autoCollapse || isOverlay.value || !slot.left) {
    return false;
  }
  return containerWidth.value < props.leftWidth + props.minRightWidth;
});
const leftVisible = computed(() => {
  if (!slot.left) {
    return false;
  }
  if (!props.leftCollapsible) {
    return true;
  }
  if (isOverlay.value) {
    return overlayOpen.value;
  }
  if (!leftOpen.value) {
    return false;
  }
  if (autoShouldCollapse.value && !userForcedOpen.value) {
    return false;
  }
  return true;
});
const collapseLabel = computed(() => (leftVisible.value ? "收起筛选" : "展开筛选"));

const storageKey = computed(() => {
  if (!props.persistenceKey) {
    return "";
  }
  return buildUiPreferenceKey(
    FILTER_LEFT_STORAGE_PREFIX,
    resolveUiUserKey(userStore.userInfo.user),
    props.persistenceKey,
  );
});

const rootStyle = computed(() => {
  const style: Record<string, string> = {
    "--in-filter-left-width": `${props.leftWidth}px`,
  };
  if (props.radius) {
    style["--in-container-radius"] = props.radius;
  }
  if (props.background) {
    style["--in-container-bg"] = props.background;
  }
  if (props.leftBackground) {
    style["--in-filter-left-bg"] = props.leftBackground;
  }
  if (props.borderColor) {
    style["--in-container-border-color"] = props.borderColor;
  }
  if (props.borderWidth) {
    style["--in-container-border-width"] = props.borderWidth;
  } else if (props.borderColor) {
    style["--in-container-border-width"] = "1px";
  }
  return style;
});

const persistDesktop = (open: boolean) => {
  if (!storageKey.value || isOverlay.value) {
    return;
  }
  writeUiPreference(storageKey.value, open);
};

const privateToggleLeft = () => {
  if (isOverlay.value) {
    overlayOpen.value = !overlayOpen.value;
    return;
  }
  if (!props.leftCollapsible) {
    return;
  }
  if (leftVisible.value) {
    leftOpen.value = false;
    userForcedOpen.value = false;
    persistDesktop(false);
    return;
  }
  leftOpen.value = true;
  persistDesktop(true);
  userForcedOpen.value = autoShouldCollapse.value;
};

const privateCloseOverlay = () => {
  overlayOpen.value = false;
};

watch(
  () => [storageKey.value, overlayQuery.value],
  () => {
    if (!storageKey.value || overlayQuery.value) {
      return;
    }
    leftOpen.value = readUiPreference(storageKey.value, leftOpen.value);
  },
  { immediate: true },
);

watch(isOverlay, (overlay) => {
  if (overlay) {
    overlayOpen.value = false;
    userForcedOpen.value = false;
  }
});

watch(autoShouldCollapse, (shouldCollapse) => {
  if (!shouldCollapse) {
    userForcedOpen.value = false;
  }
});

let resizeObserver: ResizeObserver | undefined;

const privateApplyWidth = (width: number) => {
  if (width <= 0) {
    return;
  }
  containerWidth.value = width;
};

onMounted(() => {
  const el = rootRef.value;
  if (!el || typeof ResizeObserver === "undefined") {
    return;
  }
  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width;
    if (typeof width === "number") {
      privateApplyWidth(width);
    }
  });
  resizeObserver.observe(el);
  privateApplyWidth(el.getBoundingClientRect().width);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style lang="postcss" scoped>
.in-filter-container {
  @apply w-full flex flex-col min-w-0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: var(--in-container-bg);
  border-radius: var(--in-container-radius);
  border: var(--in-container-border-width) solid var(--in-container-border-color);

  &.is-plain {
    --in-container-border-width: 0px;
  }

  &.is-bordered {
    --in-container-border-width: 1px;
  }

  & .in-filter-container-header {
    flex: none;
    min-height: var(--in-filter-header-min-height);
    padding: var(--in-filter-header-padding);
    background: var(--in-bg-color-surface);
    border-bottom: 1px solid var(--in-border-color);
    box-sizing: border-box;
  }

  & .in-filter-container-left-right {
    @apply flex flex-row min-w-0;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  & .left-filter {
    flex: none;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
    height: 100%;
    width: var(--in-filter-left-width);
    overflow: hidden;
    background: var(--in-filter-left-bg, var(--in-container-bg));
    border-right: 1px solid var(--in-border-color);
    transition: width var(--in-motion-duration-split) var(--in-motion-ease);
  }

  & .left-filter.is-collapsed {
    width: 0;
    border-right-width: 0;
  }

  & .left-filter__scroll {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--in-space-3);
    height: 100%;
    min-height: 0;
    width: var(--in-filter-left-width);
    overflow: auto;
    padding: var(--in-section-padding);
  }

  & .left-filter__scroll > :deep(*) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  &.is-left-overlay .left-filter {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 20;
    width: var(--in-filter-left-width);
    transform: translateX(-100%);
    box-shadow: var(--in-shadow-overlay);
    border-right: 1px solid var(--in-border-color);
    transition:
      transform var(--in-motion-duration-split) var(--in-motion-ease),
      width var(--in-motion-duration-split) var(--in-motion-ease);
  }

  &.is-left-overlay .left-filter.is-collapsed {
    width: var(--in-filter-left-width);
  }

  &.is-left-overlay-open .left-filter {
    transform: translateX(0);
  }

  & .in-filter-container__mask {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: var(--in-overlay-mask);
  }

  & .in-filter-container__collapse {
    position: absolute;
    top: 50%;
    left: var(--in-filter-left-width);
    z-index: 21;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--in-split-collapse-width);
    height: var(--in-split-collapse-height);
    margin: 0;
    padding: 0;
    border: 1px solid var(--in-border-color);
    border-left: 0;
    border-radius: 0 var(--in-split-collapse-radius) var(--in-split-collapse-radius) 0;
    background: var(--in-bg-color-surface);
    color: var(--in-text-color-secondary);
    box-shadow: 2px 0 6px rgba(31, 35, 41, 0.08);
    cursor: pointer;
    transform: translate(-1px, -50%);
    transition:
      left var(--in-motion-duration-split) var(--in-motion-ease),
      transform var(--in-motion-duration-split) var(--in-motion-ease);
  }

  & .in-filter-container__collapse-icon {
    width: 12px;
    height: 12px;
    transition: transform var(--in-motion-duration-split) var(--in-motion-ease);
  }

  & .in-filter-container__collapse:hover {
    color: var(--in-text-color);
  }

  & .in-filter-container__collapse:focus-visible {
    outline: 2px solid var(--in-focus-ring-color);
    outline-offset: 2px;
  }

  & .in-filter-container__collapse.is-collapsed {
    left: 0;
  }

  & .in-filter-container__collapse.is-collapsed .in-filter-container__collapse-icon {
    transform: rotate(180deg);
  }

  &.is-left-overlay .in-filter-container__collapse {
    left: 0;
  }

  &.is-left-overlay-open .in-filter-container__collapse {
    left: var(--in-filter-left-width);
  }

  & .in-filter-container-right {
    @apply flex flex-col min-w-0 flex-1;
    min-height: 0;
    overflow: hidden;
    background: var(--in-bg-color-surface);

    & .top-filter {
      flex: none;
      padding: var(--in-space-5);
    }

    & .inner-container {
      @apply flex flex-col box-border min-w-0;
      flex: 1;
      min-height: 0;
      padding: 0;
      overflow: hidden;
    }

    & .inner-container > :deep(*) {
      flex: 1;
      min-height: 0;
      max-height: 100%;
    }
  }

  &.is-compact {
    --in-section-padding: var(--in-space-3);
  }
}
</style>
