<template>
  <el-drawer
    ref="drawerRef"
    class="in-drawer"
    :class="{ 'in-drawer--pinned': layout === 'pinned' }"
    direction="rtl"
    :close-on-click-modal="false"
    :show-close="effectiveShowClose"
    :modal-class="overlayClass"
    :z-index="zIndex"
  >
    <template #header>
      <div v-if="closePosition === 'start'" class="in-drawer__start-header">
        <button type="button" class="in-drawer__close-start" @click="privateHandleClose">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20.778 20.778a1 1 0 0 0 0-1.414L13.414 12l7.364-7.364a1 1 0 0 0-1.414-1.414L12 10.586 4.636 3.222a1 1 0 0 0-1.414 1.414L10.586 12l-7.364 7.364a1 1 0 1 0 1.414 1.414L12 13.414l7.364 7.364a1 1 0 0 0 1.414 0Z"
              fill="currentColor"
            />
          </svg>
          关闭
        </button>
        <span class="in-drawer__close-divider" />
        <div v-if="slots.header" class="min-w-0">
          <slot name="header" />
        </div>
        <div v-else class="in-drawer__start-title">{{ title }}</div>
      </div>
      <div v-else-if="slots.header">
        <slot name="header" />
      </div>
      <div v-else class="in-custom-title">
        <div class="title">{{ title }}</div>
      </div>
    </template>

    <div class="in-drawer__body" :style="`padding: ${padding}`">
      <in-loading :loading="isLoading">
        <slot />
      </in-loading>
    </div>

    <template v-if="slots.footer" #footer>
      <div class="in-drawer__footer">
        <slot name="footer" />
      </div>
    </template>
  </el-drawer>
</template>
<script lang="ts" setup>
import type { InDrawerClosePosition, InDrawerLayout } from "../types";
import InLoading from "../InLoading.vue";

defineOptions({
  name: "InDrawer",
});

const slots = useSlots();
const props = withDefaults(
  defineProps<{
    title?: string;
    padding?: string;
    loading?: unknown;
    layout?: InDrawerLayout;
    /**
     * 遮罩背景。缺省透明；需要压暗时传入如 `var(--in-overlay-mask)`。
     */
    overlayColor?: string;
    /** 追加到遮罩上的 class，可与 `overlay-color` 一起用来自定义遮罩 */
    modalClass?: string | string[];
    /** 是否显示右上角关闭。全屏向导用 `close-position="start"` 时自动关掉。 */
    showClose?: boolean;
    /** 关闭位置。`start` 时标题栏左侧放「关闭」，对齐编辑权限。 */
    closePosition?: InDrawerClosePosition;
    /** 覆盖层叠。从对话框内再开抽屉时需高于对话框。 */
    zIndex?: number;
  }>(),
  {
    padding: "var(--in-section-padding-relaxed)",
    layout: "default",
    showClose: true,
    closePosition: "end",
  },
);
const drawerRef = ref<{ handleClose?: () => void }>();
const isLoading = computed(() => Boolean(unref(props.loading)));
const effectiveShowClose = computed(
  () => props.closePosition !== "start" && props.showClose,
);
const privateHandleClose = (): void => {
  drawerRef.value?.handleClose?.();
};

const overlayToneClass = `in-drawer-overlay-${useId().replaceAll(":", "")}`;
const overlayClass = computed(() =>
  ["in-drawer-overlay", props.overlayColor ? overlayToneClass : undefined, props.modalClass]
    .flat()
    .filter((item): item is string => Boolean(item)),
);

let overlayStyleEl: HTMLStyleElement | undefined;

const privateSyncOverlayStyle = () => {
  const color = props.overlayColor;
  if (!color) {
    overlayStyleEl?.remove();
    overlayStyleEl = undefined;
    return;
  }
  if (!overlayStyleEl) {
    overlayStyleEl = document.createElement("style");
    overlayStyleEl.dataset.inDrawerOverlay = overlayToneClass;
    document.head.appendChild(overlayStyleEl);
  }
  overlayStyleEl.textContent = `.el-overlay.${overlayToneClass}{background-color:${color};}`;
};

onMounted(privateSyncOverlayStyle);
watch(() => props.overlayColor, privateSyncOverlayStyle);
onUnmounted(() => {
  overlayStyleEl?.remove();
});
</script>
<style lang="postcss">
.el-overlay.in-drawer-overlay {
  --el-overlay-color: transparent;
  --el-overlay-color-lighter: transparent;
  background-color: var(--in-drawer-overlay, transparent);
}

.in-drawer {
  --el-drawer-padding-primary: 0;

  & .el-drawer__header {
    border-bottom: 1px solid var(--in-border-color);
    margin-bottom: 0;
    padding: var(--in-space-4) var(--in-section-padding-relaxed);
  }

  & .el-drawer__body {
    overflow: auto;
  }

  & .in-drawer__body {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  & .in-drawer__body > .in-loading {
    flex: 1;
    min-height: 160px;
    width: 100%;
  }

  &.in-drawer--pinned {
    & .el-drawer__body {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    & .in-drawer__body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
  }

  & .el-drawer__footer {
    padding: var(--in-space-3) var(--in-section-padding-relaxed);
    border-top: 1px solid var(--in-border-color);
    background: var(--in-bg-color);
    box-shadow: none;
  }

  & .in-drawer__footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--in-space-2);
  }

  & .in-custom-title {
    display: flex;
    flex-direction: row;
    align-items: center;

    & .title {
      font-weight: var(--in-font-weight-section-title);
      color: var(--in-text-color);
      font-size: var(--in-font-size-section-title);
      line-height: var(--in-line-height-section-title);
    }
  }

  & .in-drawer__start-header {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
  }

  & .in-drawer__start-title {
    color: var(--in-text-color);
  }

  & .in-drawer__close-divider {
    width: 1px;
    height: 16px;
    background: var(--in-border-color);
  }

  & .in-drawer__close-start {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 0;
    border-radius: var(--in-radius-control);
    background: transparent;
    color: var(--in-text-color);
    cursor: pointer;
    font-size: 14px;
    transition:
      background-color var(--in-motion-duration) var(--in-motion-ease),
      color var(--in-motion-duration) var(--in-motion-ease);
  }

  & .in-drawer__close-start svg {
    font-size: 16px;
  }

  & .in-drawer__close-start:hover {
    background: var(--in-bg-color-hover);
    color: var(--in-text-color);
  }

  & .in-drawer__close-start:active {
    background: var(--in-bg-color-active);
  }
}
</style>
