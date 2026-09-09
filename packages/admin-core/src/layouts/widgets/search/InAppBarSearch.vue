<template>
  <div
    ref="rootRef"
    class="in-app-bar-search"
    :class="{ 'is-compact': compact, 'is-open': panelOpen }"
    data-testid="app-bar-search-field"
    @keydown.capture="privateOnKeydown"
  >
    <el-input
      ref="inputRef"
      v-model="keyword"
      :placeholder="placeholder"
      :prefix-icon="Search"
      class="in-input"
      clearable
      role="combobox"
      :aria-expanded="panelOpen"
      aria-autocomplete="list"
      @focus="privateOpen"
      @click="privateOpen"
    />
    <Teleport :disabled="compact" to="body">
      <div
        v-if="panelOpen"
        ref="panelHostRef"
        class="in-app-bar-search__panel-host"
        :class="{ 'is-inline': compact }"
        :style="compact ? undefined : panelStyle"
      >
        <in-app-bar-search-panel
          :show-history="showHistory"
          :has-query="hasQuery"
          :loading="loading"
          :history="history"
          :results="results"
          :shortcuts="shortcuts"
          :keyword="activeQuery"
          :empty-hint="emptyHint"
          :highlighted-index="highlightedIndex"
          :inline="compact"
          @apply-history="privateApplyHistory"
          @clear-history="privateClearHistory"
          @select="privateSelectResult"
          @pick-shortcut="privateSelectShortcut"
        />
      </div>
    </Teleport>
  </div>
</template>
<script lang="ts" setup>
import type { InputInstance } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { DEFAULT_HEADER_SEARCH_PLACEHOLDER } from "../header/defaults";
import type { ResolvedHeaderSearchShortcut } from "../header/resolveHeaderConfig";
import { useRouterStore } from "@/stores/modules/router";
import { useHeaderSearchStore } from "@/stores/modules/headerSearch";
import InAppBarSearchPanel from "./InAppBarSearchPanel.vue";
import { HEADER_SEARCH_DEBOUNCE_MS, DEFAULT_HEADER_SEARCH_EMPTY_HINT } from "./constants";
import { filterMenusByName, flattenMenus, type FlattenedMenuItem } from "./flattenMenus";

defineOptions({
  name: "InAppBarSearch",
});

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    compact?: boolean;
    shortcuts?: ResolvedHeaderSearchShortcut[];
    emptyHint?: string;
  }>(),
  {
    placeholder: DEFAULT_HEADER_SEARCH_PLACEHOLDER,
    compact: false,
    shortcuts: () => [],
    emptyHint: DEFAULT_HEADER_SEARCH_EMPTY_HINT,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const { getMenus } = storeToRefs(useRouterStore());
const searchStore = useHeaderSearchStore();
const { history } = storeToRefs(searchStore);

const rootRef = ref<HTMLElement>();
const inputRef = ref<InputInstance>();
const panelHostRef = ref<HTMLElement>();
const keyword = ref("");
const activeQuery = ref("");
const loading = ref(false);
const panelOpen = ref(false);
const highlightedIndex = ref(-1);
const panelStyle = ref<Record<string, string>>({});
let debounceTimer = 0;

const leaves = computed(() => flattenMenus(getMenus.value));
const hasQuery = computed(() => keyword.value.trim().length > 0);
const results = computed(() => filterMenusByName(leaves.value, activeQuery.value));
const showHistory = computed(() => !hasQuery.value && history.value.length > 0);
const highlightableCount = computed(() => {
  if (loading.value) {
    return 0;
  }
  if (hasQuery.value) {
    return results.value.length;
  }
  return props.shortcuts.length;
});

const privatePlacePanel = () => {
  const trigger = rootRef.value;
  if (!trigger || props.compact) {
    return;
  }
  const rect = trigger.getBoundingClientRect();
  const top = rect.bottom + 8;
  const width = Math.max(rect.width, 160);
  const maxLeft = Math.max(8, window.innerWidth - width - 8);
  panelStyle.value = {
    position: "fixed",
    top: `${Math.round(top)}px`,
    left: `${Math.round(Math.min(Math.max(8, rect.left), maxLeft))}px`,
    width: `${Math.round(width)}px`,
    maxHeight: `${Math.round(Math.max(120, window.innerHeight - top - 12))}px`,
    zIndex: "var(--in-z-dropdown)",
  };
};

const privateClosePanel = () => {
  panelOpen.value = false;
};

const privateSyncHighlight = () => {
  highlightedIndex.value = highlightableCount.value > 0 ? 0 : -1;
};

const privateOpen = () => {
  if (panelOpen.value) {
    return;
  }
  panelOpen.value = true;
  privateSyncHighlight();
};

const privateApplyHistory = (value: string) => {
  keyword.value = value;
  highlightedIndex.value = 0;
};

const privateClearHistory = () => {
  searchStore.clearHistory();
};

const privateSelectResult = (item: FlattenedMenuItem) => {
  searchStore.pushKeyword(keyword.value);
  privateClosePanel();
  emit("close");
  void router.push(item.path);
};

const privateSelectShortcut = (item: ResolvedHeaderSearchShortcut) => {
  privateClosePanel();
  emit("close");
  void router.push(item.path);
};

const privateConfirm = () => {
  if (loading.value) {
    return;
  }
  if (hasQuery.value) {
    const item = results.value[highlightedIndex.value];
    if (item) {
      privateSelectResult(item);
    }
    return;
  }
  const shortcut = props.shortcuts[highlightedIndex.value];
  if (shortcut) {
    privateSelectShortcut(shortcut);
  }
};

const privateOnKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    privateClosePanel();
    return;
  }
  if (!panelOpen.value) {
    if (event.key === "ArrowDown") {
      privateOpen();
    }
    return;
  }
  const count = highlightableCount.value;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (count === 0) {
      return;
    }
    highlightedIndex.value = (highlightedIndex.value + 1) % count;
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (count === 0) {
      return;
    }
    highlightedIndex.value = highlightedIndex.value <= 0 ? count - 1 : highlightedIndex.value - 1;
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    privateConfirm();
  }
};

const privateOnDocumentPointer = (event: MouseEvent) => {
  if (props.compact) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }
  if (rootRef.value?.contains(target) || panelHostRef.value?.contains(target)) {
    return;
  }
  if (target instanceof Element && target.closest(".el-popper, .el-overlay")) {
    return;
  }
  privateClosePanel();
};

const unbindFloating = () => {
  document.removeEventListener("mousedown", privateOnDocumentPointer);
  window.removeEventListener("scroll", privatePlacePanel, true);
  window.removeEventListener("resize", privatePlacePanel);
};

const bindFloating = () => {
  unbindFloating();
  document.addEventListener("mousedown", privateOnDocumentPointer);
  window.addEventListener("scroll", privatePlacePanel, true);
  window.addEventListener("resize", privatePlacePanel);
  nextTick(privatePlacePanel);
};

watch(keyword, (value) => {
  window.clearTimeout(debounceTimer);
  const trimmed = value.trim();
  if (!trimmed) {
    loading.value = false;
    activeQuery.value = "";
    return;
  }
  loading.value = true;
  debounceTimer = window.setTimeout(() => {
    activeQuery.value = trimmed;
    loading.value = false;
  }, HEADER_SEARCH_DEBOUNCE_MS);
});

watch([activeQuery, results, loading, () => props.shortcuts.length, hasQuery], () => {
  if (panelOpen.value) {
    privateSyncHighlight();
  }
});

watch([panelOpen, () => props.compact], ([open, compact]) => {
  if (open && !compact) {
    bindFloating();
    return;
  }
  unbindFloating();
});

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer);
  unbindFloating();
});

const focusInput = () => {
  inputRef.value?.focus();
  privateOpen();
};

defineExpose({ focusInput });
</script>
<style lang="postcss" scoped>
.in-app-bar-search {
  width: var(--in-app-bar-search-width);
  max-width: 100%;
  flex: none;
  color: var(--in-text-color);

  &.is-compact {
    width: 100%;
  }

  & .in-input {
    --el-input-placeholder-color: var(--in-text-color-placeholder);
    --el-input-icon-color: var(--in-text-color-placeholder);
    --el-input-border-radius: var(--in-radius-control);
    --el-input-border-color: var(--in-border-color);
    --el-input-hover-border-color: var(--in-border-color);
    --el-input-focus-border-color: var(--in-color-primary);
    --el-input-bg-color: var(--in-bg-color-mute);
    --el-input-text-color: var(--in-text-color);
  }
}

.in-app-bar-search__panel-host.is-inline {
  width: 100%;
}
</style>
