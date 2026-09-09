<template>
  <el-drawer
    class="in-drawer"
    :class="{ 'in-drawer--pinned': layout === 'pinned' }"
    direction="rtl"
    :close-on-click-modal="false"
    :modal-class="overlayClass"
  >
    <template #header>
      <div v-if="slots.header">
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

    <template #footer>
      <div class="in-drawer__footer">
        <slot name="footer"> </slot>
      </div>
    </template>
  </el-drawer>
</template>
<script lang="ts" setup>
import type { InDrawerLayout } from "../types";
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
  }>(),
  {
    padding: "var(--in-section-padding-relaxed)",
    layout: "default",
  },
);
const isLoading = computed(() => Boolean(unref(props.loading)));
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
      overflow: hidden;
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
}
</style>
