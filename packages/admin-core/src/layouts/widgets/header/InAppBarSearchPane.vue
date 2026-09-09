<template>
  <div class="in-app-bar-search-pane" data-testid="app-bar-search">
    <template v-if="enabled">
      <el-tooltip
        v-if="compact"
        :disabled="open"
        content="搜索"
        effect="dark"
        placement="bottom"
      >
        <button
          ref="triggerRef"
          type="button"
          class="in-icon-button"
          aria-label="搜索"
          :aria-expanded="open"
          @click="privateToggle"
        >
          <in-icon name="ep:search" class="in-app-bar__icon" />
        </button>
      </el-tooltip>
      <Teleport :disabled="!(compact && open)" :to="overlayTarget">
        <div
          class="in-app-bar-search-host"
          :class="{ 'is-parked': compact && !open }"
        >
          <component
            :is="searchComponent ?? defaultSearch"
            ref="searchInstanceRef"
            :placeholder="placeholder"
            :compact="compact"
            :shortcuts="shortcuts"
            :empty-hint="emptyHint"
            @close="privateOnSearchClose"
          />
        </div>
      </Teleport>
      <div
        ref="overlayRef"
        class="in-app-bar-overlay"
        :class="{ 'is-open': compact && open }"
        role="dialog"
        aria-label="搜索"
        tabindex="-1"
        :aria-hidden="!(compact && open)"
        :style="panelStyle"
        @keydown="privateOnKeydown"
      ></div>
    </template>
  </div>
</template>
<script setup lang="ts">
import type { Component } from "vue";
import type { ResolvedHeaderSearchShortcut } from "./resolveHeaderConfig";
import { DEFAULT_HEADER_SEARCH_EMPTY_HINT } from "../search/constants";
import InAppBarSearch from "../search/InAppBarSearch.vue";
import { useAppBarOverlay } from "./useAppBarOverlay";

defineOptions({
  name: "InAppBarSearchPane",
});

const props = withDefaults(
  defineProps<{
    enabled: boolean;
    compact: boolean;
    placeholder: string;
    emptyHint?: string;
    shortcuts?: ResolvedHeaderSearchShortcut[];
    searchComponent?: Component;
  }>(),
  {
    emptyHint: DEFAULT_HEADER_SEARCH_EMPTY_HINT,
    shortcuts: () => [],
  },
);

const emit = defineEmits<{
  "open-panel": [id: string];
  "close-panel": [];
}>();

type SearchInstance = {
  focusInput?: () => void;
};

const defaultSearch = InAppBarSearch;
const triggerRef = ref<HTMLElement>();
const overlayRef = ref<HTMLElement>();
const searchInstanceRef = ref<SearchInstance | null>(null);
const open = ref(false);
const { panelStyle, privateToggle: toggleOverlay, privateClose } = useAppBarOverlay({
  open,
  triggerRef,
  panelRef: overlayRef,
  maxWidth: 424,
});

const overlayTarget = computed(() => overlayRef.value ?? "body");

const privateOnSearchClose = () => {
  if (!open.value) {
    return;
  }
  emit("close-panel");
  privateClose();
};

const privateToggle = () => {
  if (open.value) {
    emit("close-panel");
    privateClose(true);
    return;
  }
  emit("open-panel", "search");
  toggleOverlay();
  nextTick(() => {
    searchInstanceRef.value?.focusInput?.();
  });
};

const privateOnKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close-panel");
    privateClose(true);
  }
};

watch(
  () => props.compact,
  (compact) => {
    if (!compact && open.value) {
      open.value = false;
      emit("close-panel");
    }
  },
);

const close = () => {
  if (open.value) {
    privateClose();
    emit("close-panel");
  }
};

defineExpose({ close, triggerRef });
</script>
<style lang="postcss" scoped>
.in-app-bar-search-pane {
  @apply flex items-center min-w-0 relative;
  flex: none;
  justify-content: flex-end;
}

.in-app-bar-search-host.is-parked {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.in-app-bar-overlay {
  position: fixed;
  z-index: var(--in-z-dropdown);
  box-sizing: border-box;
  min-width: var(--in-app-bar-search-width);
  padding: var(--in-space-3);
  overflow: auto;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-overlay);
  visibility: hidden;
  pointer-events: none;
}

.in-app-bar-overlay.is-open {
  visibility: visible;
  pointer-events: auto;
}
</style>
