<template>
  <span class="in-filter-panel" :class="{ 'is-open': open }">
    <el-tooltip :disabled="open" content="筛选条件" effect="dark" placement="top">
      <button
        ref="triggerRef"
        type="button"
        class="in-filter-panel__trigger"
        aria-label="筛选条件"
        :aria-expanded="open"
        aria-haspopup="dialog"
        @click="privateToggle"
        @keydown="privateOnTriggerKeydown"
      >
        <svg
          class="in-filter-panel__icon"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 19.8 6.3L15 12.2V18a1.5 1.5 0 0 1-2.2 1.32l-2-1.2A1.5 1.5 0 0 1 10 17v-4.8L4.2 6.3A1.5 1.5 0 0 1 4 5.5Z"
            fill="currentColor"
          />
        </svg>
        <span class="in-filter-panel__text">筛选</span>
        <span v-if="activeCount > 0" class="in-filter-panel__badge">{{ displayCount }}</span>
      </button>
    </el-tooltip>
    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="in-filter-panel__panel"
        role="dialog"
        aria-label="筛选条件"
        tabindex="-1"
        :style="panelStyle"
        @keydown="privateOnPanelKeydown"
      >
        <div class="in-filter-panel__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="in-filter-panel__footer">
          <slot name="footer" />
        </div>
      </div>
    </Teleport>
  </span>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

defineOptions({
  name: "InFilterPanel",
});

const props = withDefaults(
  defineProps<{
    activeCount?: number;
  }>(),
  {
    activeCount: 0,
  },
);

const PANEL_WIDTH = 320;
const OVERLAY_SELECTOR = ".el-popper, .el-select-dropdown, .in-picker__menu";

const triggerRef = ref<HTMLButtonElement>();
const panelRef = ref<HTMLElement>();
const open = ref(false);
const panelStyle = ref<Record<string, string>>({});

const displayCount = computed(() => (props.activeCount > 99 ? "99+" : String(props.activeCount)));

const privatePlacePanel = () => {
  const trigger = triggerRef.value;
  if (!trigger) {
    return;
  }
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(rect.left, Math.max(8, window.innerWidth - PANEL_WIDTH - 8));
  panelStyle.value = {
    top: `${Math.round(rect.bottom + 4)}px`,
    left: `${Math.round(left)}px`,
  };
};

const privateClose = (restoreFocus = false) => {
  open.value = false;
  if (restoreFocus) {
    triggerRef.value?.focus();
  }
};

const privateToggle = () => {
  open.value = !open.value;
  if (open.value) {
    nextTick(() => {
      privatePlacePanel();
      panelRef.value?.focus();
    });
    return;
  }
  triggerRef.value?.focus();
};

const privateOnTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    privateClose(true);
  }
};

const privateOnPanelKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    privateClose(true);
  }
};

const privateIsOverlayTarget = (target: Node): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest(OVERLAY_SELECTOR));
};

const privateOnDocumentPointer = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) {
    return;
  }
  if (privateIsOverlayTarget(target)) {
    return;
  }
  privateClose();
};

watch(open, (visible) => {
  if (visible) {
    document.addEventListener("mousedown", privateOnDocumentPointer);
    window.addEventListener("scroll", privatePlacePanel, true);
    window.addEventListener("resize", privatePlacePanel);
    return;
  }
  document.removeEventListener("mousedown", privateOnDocumentPointer);
  window.removeEventListener("scroll", privatePlacePanel, true);
  window.removeEventListener("resize", privatePlacePanel);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", privateOnDocumentPointer);
  window.removeEventListener("scroll", privatePlacePanel, true);
  window.removeEventListener("resize", privatePlacePanel);
});
</script>
<style lang="postcss" scoped>
.in-filter-panel {
  display: inline-flex;
  overflow: visible;
}

.in-filter-panel__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--in-space-2);
  box-sizing: border-box;
  height: var(--in-control-height);
  margin: 0;
  padding: 0 var(--in-space-3);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  cursor: pointer;
}

.in-filter-panel__trigger:hover,
.in-filter-panel.is-open .in-filter-panel__trigger {
  border-color: var(--in-color-primary);
}

.in-filter-panel__trigger:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-filter-panel__icon {
  display: block;
  width: 16px;
  height: 16px;
  color: var(--in-text-color-secondary);
}

.in-filter-panel__text {
  flex: none;
}

.in-filter-panel__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--in-color-primary);
  color: var(--in-text-color-inverse);
  font-size: 11px;
  line-height: 16px;
}
</style>
<style lang="postcss">
/* 浮层 Teleport 到 body，样式不能依赖 scoped 父级 */
.in-filter-panel__panel {
  position: fixed;
  z-index: var(--in-z-dropdown);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 320px;
  min-width: 320px;
  max-height: min(426px, calc(100vh - 16px));
  padding: var(--in-space-3) 0 0;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-md);
  outline: none;
}

.in-filter-panel__body {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-3);
  min-height: 0;
  overflow: auto;
  padding: 0 var(--in-space-3) var(--in-space-3);
}

.in-filter-panel__body .in-picker {
  display: flex;
  width: 100%;
}

.in-filter-panel__body .in-picker + .in-picker {
  margin-inline-start: 0;
}

.in-filter-panel__body .in-picker__trigger {
  width: 100%;
}

.in-filter-panel__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--in-space-2);
  padding: var(--in-space-2) var(--in-space-3);
  border-top: 1px solid var(--in-border-color);
}
</style>
