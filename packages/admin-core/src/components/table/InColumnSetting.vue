<template>
  <span class="in-column-setting">
    <el-tooltip :disabled="open" content="设置显示字段" effect="light" placement="top">
      <button
        ref="triggerRef"
        type="button"
        class="in-column-setting__trigger"
        aria-label="设置显示字段"
        :aria-expanded="open"
        @click="privateToggle"
        @keydown="privateOnTriggerKeydown"
      >
        <in-icon name="ep:setting" class="in-column-setting__icon" />
      </button>
    </el-tooltip>
    <div
      v-if="open"
      ref="panelRef"
      class="in-column-setting__panel"
      role="dialog"
      aria-label="字段显示设置"
      @keydown="privateOnPanelKeydown"
    >
      <label class="in-column-setting__item is-all">
        <input
          type="checkbox"
          :checked="allChecked"
          :indeterminate.prop="allIndeterminate"
          @change="privateOnToggleAll"
        />
        <span>全部</span>
      </label>
      <div class="in-column-setting__list">
        <label
          v-for="item in configurableHeaders"
          :key="String(item.prop)"
          class="in-column-setting__item"
          :class="{ 'is-locked': isTableHeaderLocked(item) }"
        >
          <input
            type="checkbox"
            :checked="selectedProps.includes(String(item.prop))"
            :disabled="isTableHeaderLocked(item)"
            @change="privateOnToggle(String(item.prop))"
          />
          <span>{{ item.label }}</span>
        </label>
      </div>
    </div>
  </span>
</template>
<script lang="ts" setup>
import type { TableHeaderRecord } from "./types";
import { isTableHeaderLocked } from "./columnVisibility";
import { useUserInfoStore } from "@/stores/modules/auth";
import {
  buildUiPreferenceKey,
  COLUMN_SETTING_STORAGE_PREFIX,
  readUiPreference,
  resolveUiUserKey,
  writeUiPreference,
} from "@/utils/uiPreference";

defineOptions({
  name: "InColumnSetting",
});

const props = withDefaults(
  defineProps<{
    data?: Array<TableHeaderRecord>;
    headers?: Array<TableHeaderRecord>;
    tableId?: string;
  }>(),
  {
    data: () => [],
    headers: () => [],
    tableId: "",
  },
);

const emits = defineEmits<{
  onSelectionChange: [value: string[]];
  change: [value: string[]];
}>();

const userStore = useUserInfoStore();
const triggerRef = ref<HTMLButtonElement>();
const panelRef = ref<HTMLElement>();
const open = ref(false);
const selectedProps = ref<string[]>([]);

const columns = computed(() => (props.headers.length > 0 ? props.headers : props.data));

const storageKey = computed(() => {
  if (!props.tableId) {
    return "";
  }
  return buildUiPreferenceKey(
    COLUMN_SETTING_STORAGE_PREFIX,
    resolveUiUserKey(userStore.userInfo.user),
    props.tableId,
  );
});

const configurableHeaders = computed(() =>
  columns.value.filter((item) => item.prop && item.type !== "expand"),
);

const unlockedHeaders = computed(() =>
  configurableHeaders.value.filter((item) => !isTableHeaderLocked(item)),
);

const allChecked = computed(() => {
  return (
    unlockedHeaders.value.length > 0 &&
    unlockedHeaders.value.every((item) => selectedProps.value.includes(String(item.prop)))
  );
});

const allIndeterminate = computed(() => {
  const selectedUnlocked = unlockedHeaders.value.filter((item) =>
    selectedProps.value.includes(String(item.prop)),
  );
  return selectedUnlocked.length > 0 && selectedUnlocked.length < unlockedHeaders.value.length;
});

const defaultSelected = (): string[] => {
  return configurableHeaders.value
    .filter((item) => isTableHeaderLocked(item) || !item.hide)
    .map((item) => String(item.prop));
};

const emitSelection = (value: string[]) => {
  const selected = new Set(value);
  const next = configurableHeaders.value
    .filter((item) => isTableHeaderLocked(item) || selected.has(String(item.prop)))
    .map((item) => String(item.prop));
  selectedProps.value = next;
  emits("onSelectionChange", next);
  emits("change", next);
  if (storageKey.value) {
    writeUiPreference(storageKey.value, next);
  }
};

const hydrate = () => {
  const fallback = defaultSelected();
  if (!storageKey.value) {
    selectedProps.value = fallback;
    emits("onSelectionChange", fallback);
    emits("change", fallback);
    return;
  }
  const stored = readUiPreference<string[]>(storageKey.value, fallback);
  emitSelection(stored);
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
      panelRef.value?.querySelector<HTMLInputElement>("input")?.focus();
    });
  } else {
    triggerRef.value?.focus();
  }
};

const privateOnToggle = (prop: string) => {
  const header = configurableHeaders.value.find((item) => String(item.prop) === prop);
  if (!header || isTableHeaderLocked(header)) {
    return;
  }
  const next = selectedProps.value.includes(prop)
    ? selectedProps.value.filter((item) => item !== prop)
    : [...selectedProps.value, prop];
  emitSelection(next);
};

const privateOnToggleAll = () => {
  if (allChecked.value) {
    emitSelection(
      configurableHeaders.value
        .filter((item) => isTableHeaderLocked(item))
        .map((item) => String(item.prop)),
    );
    return;
  }
  emitSelection(configurableHeaders.value.map((item) => String(item.prop)));
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

const privateOnDocumentPointer = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) {
    return;
  }
  privateClose();
};

watch(
  () =>
    [
      props.tableId,
      columns.value.map((item) => String(item.prop ?? "")).join(","),
      resolveUiUserKey(userStore.userInfo.user),
    ].join("|"),
  () => {
    hydrate();
  },
  { immediate: true },
);

watch(open, (visible) => {
  if (visible) {
    document.addEventListener("mousedown", privateOnDocumentPointer);
    return;
  }
  document.removeEventListener("mousedown", privateOnDocumentPointer);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", privateOnDocumentPointer);
});
</script>
<style lang="postcss" scoped>
.in-column-setting {
  position: relative;
  display: inline-flex;
}

.in-column-setting__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--in-icon-button-size);
  height: var(--in-icon-button-size);
  margin: 0;
  padding: 0;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  color: var(--in-text-color-secondary);
  cursor: pointer;
}

.in-column-setting__trigger:hover {
  background: var(--in-bg-color-hover);
  color: var(--in-text-color);
}

.in-column-setting__trigger:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-column-setting__icon {
  width: 16px;
  height: 16px;
}

.in-column-setting__panel {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: var(--in-z-dropdown);
  width: 213px;
  max-height: 426px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: var(--in-space-2);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-overlay);
}

.in-column-setting__list {
  overflow: auto;
  min-height: 0;
  flex: 1;
}

.in-column-setting__item {
  display: flex;
  align-items: center;
  gap: var(--in-space-2);
  min-height: 36px;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  cursor: pointer;
}

.in-column-setting__item.is-all {
  border-bottom: 1px solid var(--in-border-color);
  margin-bottom: var(--in-space-1);
  padding-bottom: var(--in-space-1);
}

.in-column-setting__item.is-locked {
  color: var(--in-text-color-secondary);
  cursor: not-allowed;
}
</style>
