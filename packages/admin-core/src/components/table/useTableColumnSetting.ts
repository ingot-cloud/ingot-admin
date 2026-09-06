import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { TableHeaderRecord } from "./types";
import {
  canReorderTableHeader,
  isTableHeaderLocked,
  normalizeColumnSettingPreference,
} from "./columnVisibility";
import { useUserInfoStore } from "@/stores/modules/auth";
import {
  buildUiPreferenceKey,
  COLUMN_SETTING_STORAGE_PREFIX,
  readUiPreference,
  resolveUiUserKey,
  writeUiPreference,
} from "@/utils/uiPreference";

type TableColumnSettingProps = {
  data: Array<TableHeaderRecord>;
  headers: Array<TableHeaderRecord>;
  tableId: string;
};

type TableColumnSettingEmits = {
  (event: "onSelectionChange", value: string[]): void;
  (event: "change", value: string[]): void;
};

export const useTableColumnSetting = (
  props: TableColumnSettingProps,
  emits: TableColumnSettingEmits,
) => {
  const userStore = useUserInfoStore();
  const triggerRef = ref<HTMLButtonElement>();
  const panelRef = ref<HTMLElement>();
  const open = ref(false);
  const selectedProps = ref<string[]>([]);
  const columnOrder = ref<string[]>([]);
  const draggingProp = ref("");
  const dragOverProp = ref("");
  const panelStyle = ref<Record<string, string>>({});

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

  const headerByProp = computed(() => {
    const next = new Map<string, TableHeaderRecord>();
    configurableHeaders.value.forEach((item) => {
      next.set(String(item.prop), item);
    });
    return next;
  });

  const orderedHeaders = computed(() => {
    const seen = new Set<string>();
    const next: Array<TableHeaderRecord> = [];
    columnOrder.value.forEach((prop) => {
      const item = headerByProp.value.get(prop);
      if (!item || seen.has(prop)) {
        return;
      }
      next.push(item);
      seen.add(prop);
    });
    configurableHeaders.value.forEach((item) => {
      const prop = String(item.prop);
      if (seen.has(prop)) {
        return;
      }
      next.push(item);
      seen.add(prop);
    });
    return next;
  });

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

  const defaultOrder = (): string[] => configurableHeaders.value.map((item) => String(item.prop));

  const defaultSelected = (): string[] => {
    return configurableHeaders.value
      .filter((item) => isTableHeaderLocked(item) || !item.hide)
      .map((item) => String(item.prop));
  };

  const emitSelection = (selected: string[], order = columnOrder.value) => {
    const selectedSet = new Set(selected);
    const nextOrder = order.length > 0 ? order : defaultOrder();
    const next = nextOrder.filter((prop) => {
      const header = headerByProp.value.get(prop);
      if (!header) {
        return false;
      }
      return isTableHeaderLocked(header) || selectedSet.has(prop);
    });
    configurableHeaders.value.forEach((item) => {
      const prop = String(item.prop);
      if (!next.includes(prop) && isTableHeaderLocked(item)) {
        next.push(prop);
      }
    });
    selectedProps.value = next;
    columnOrder.value = nextOrder;
    emits("onSelectionChange", next);
    emits("change", next);
    if (storageKey.value) {
      writeUiPreference(storageKey.value, { selected: next, order: nextOrder });
    }
  };

  const hydrate = () => {
    const fallback = { selected: defaultSelected(), order: defaultOrder() };
    if (!storageKey.value) {
      emitSelection(fallback.selected, fallback.order);
      return;
    }
    const stored = normalizeColumnSettingPreference(
      readUiPreference<unknown>(storageKey.value, fallback),
      fallback,
    );
    emitSelection(stored.selected, stored.order);
  };

  const privatePlacePanel = () => {
    const trigger = triggerRef.value;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const width = 213;
    const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 8));
    panelStyle.value = {
      top: `${Math.round(rect.bottom + 4)}px`,
      left: `${Math.round(left)}px`,
    };
  };

  const privateClose = (restoreFocus = false) => {
    open.value = false;
    draggingProp.value = "";
    dragOverProp.value = "";
    if (restoreFocus) {
      triggerRef.value?.focus();
    }
  };

  const privateToggle = () => {
    open.value = !open.value;
    if (open.value) {
      nextTick(() => {
        privatePlacePanel();
        panelRef.value?.querySelector<HTMLInputElement>("input")?.focus();
      });
    } else {
      triggerRef.value?.focus();
    }
  };

  const privateOnToggle = (prop: string) => {
    const header = headerByProp.value.get(prop);
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

  const privateOnDragStart = (prop: string, event: DragEvent) => {
    const header = headerByProp.value.get(prop);
    if (!header || !canReorderTableHeader(header)) {
      event.preventDefault();
      return;
    }
    draggingProp.value = prop;
    event.dataTransfer?.setData("text/plain", prop);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  };

  const privateOnDragOver = (prop: string, event: DragEvent) => {
    const header = headerByProp.value.get(prop);
    if (!draggingProp.value || !header || !canReorderTableHeader(header)) {
      return;
    }
    event.preventDefault();
    dragOverProp.value = prop;
  };

  const privateOnDragLeave = (prop: string) => {
    if (dragOverProp.value === prop) {
      dragOverProp.value = "";
    }
  };

  const privateOnDrop = (prop: string, event: DragEvent) => {
    event.preventDefault();
    const from = draggingProp.value;
    const source = headerByProp.value.get(from);
    const target = headerByProp.value.get(prop);
    draggingProp.value = "";
    dragOverProp.value = "";
    if (!from || from === prop || !source || !target) {
      return;
    }
    if (!canReorderTableHeader(source) || !canReorderTableHeader(target)) {
      return;
    }
    const order = orderedHeaders.value.map((item) => String(item.prop));
    const fromIndex = order.indexOf(from);
    const toIndex = order.indexOf(prop);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, from);
    emitSelection(selectedProps.value, order);
  };

  const privateOnDragEnd = () => {
    draggingProp.value = "";
    dragOverProp.value = "";
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

  return {
    triggerRef,
    panelRef,
    open,
    panelStyle,
    selectedProps,
    orderedHeaders,
    allChecked,
    allIndeterminate,
    draggingProp,
    dragOverProp,
    privateToggle,
    privateOnToggle,
    privateOnToggleAll,
    privateOnDragStart,
    privateOnDragOver,
    privateOnDragLeave,
    privateOnDrop,
    privateOnDragEnd,
    privateOnTriggerKeydown,
    privateOnPanelKeydown,
  };
};
