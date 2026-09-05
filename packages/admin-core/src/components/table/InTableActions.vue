<template>
  <div
    ref="hostRef"
    class="in-table-actions"
    :class="[`is-${variant}`, { 'is-measuring': variant === 'toolbar' && measuring }]"
  >
    <div
      v-if="variant === 'toolbar'"
      ref="measureRef"
      class="in-table-actions__measure"
      aria-hidden="true"
    >
      <span
        v-for="action in visibleActions"
        :key="action.key"
        class="in-table-actions__inline is-toolbar"
        :data-action-key="action.key"
      >
        <in-icon v-if="action.icon" :name="action.icon" class="in-table-actions__icon" />
        {{ action.label }}
      </span>
    </div>

    <template v-for="action in ranked.inline" :key="action.key">
      <el-tooltip
        :disabled="!action.disabled || !action.disabledReason"
        :content="action.disabledReason"
        effect="light"
        placement="top"
      >
        <button
          type="button"
          class="in-table-actions__inline"
          :class="{
            'is-toolbar': variant === 'toolbar',
            'is-primary': isPrimary(action),
            'is-danger': action.kind === 'danger',
            'is-disabled': action.disabled,
          }"
          :disabled="action.disabled"
          :aria-label="action.label"
          :title="action.disabled ? action.disabledReason : undefined"
          @click="privateOnSelect(action)"
        >
          <in-icon v-if="action.icon" :name="action.icon" class="in-table-actions__icon" />
          {{ action.label }}
        </button>
      </el-tooltip>
    </template>

    <div v-if="ranked.showMore" class="in-table-actions__more">
      <button
        ref="triggerRef"
        type="button"
        class="in-table-actions__more-btn"
        :class="{ 'is-toolbar': variant === 'toolbar' }"
        aria-label="更多"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        @click="privateToggleMenu"
        @keydown="privateOnTriggerKeydown"
      >
        <in-icon name="ep:more" />
      </button>
      <div
        v-if="menuOpen"
        ref="menuRef"
        class="in-table-actions__menu"
        role="menu"
        @keydown="privateOnMenuKeydown"
      >
        <button
          v-for="(action, index) in ranked.menu"
          :key="action.key"
          type="button"
          class="in-table-actions__item"
          :class="{
            'is-danger': action.kind === 'danger',
            'is-disabled': action.disabled,
            'is-active': index === activeIndex,
          }"
          role="menuitem"
          :tabindex="index === activeIndex ? 0 : -1"
          :disabled="action.disabled"
          :title="action.disabled ? action.disabledReason : undefined"
          :aria-label="action.disabled && action.disabledReason ? `${action.label}，${action.disabledReason}` : action.label"
          @click="privateOnSelect(action)"
          @mouseenter="activeIndex = index"
        >
          <in-icon v-if="action.icon" :name="action.icon" class="in-table-actions__icon" />
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup generic="Row">
import type { InTableAction } from "../types";
import {
  filterActionsByContext,
  filterActionsByPermission,
  layoutToolbarOverflow,
  rankTableActions,
  resolveActionConfirm,
  resolveActionOverflow,
  sameActionKeys,
  type RankedTableActions,
} from "./actionRanking";
import { usePermissions } from "@/stores/modules/auth";
import { useMessageConfirm } from "@/hooks/web/useMessage";

defineOptions({
  name: "InTableActions",
});

const props = withDefaults(
  defineProps<{
    actions: Array<InTableAction<Row>>;
    row: Row;
    variant?: "row" | "toolbar";
    selectedCount?: number;
  }>(),
  {
    variant: "row",
    selectedCount: 0,
  },
);

const permissions = usePermissions();
const confirm = useMessageConfirm();
const hostRef = ref<HTMLElement>();
const measureRef = ref<HTMLElement>();
const triggerRef = ref<HTMLButtonElement>();
const menuRef = ref<HTMLElement>();
const menuOpen = ref(false);
const activeIndex = ref(0);
const measuring = ref(true);
const toolbarRanked = ref<RankedTableActions<Row>>({
  inline: [],
  menu: [],
  showMore: false,
});

const allowedPermissions = computed(() => [
  ...permissions.permissions,
  ...permissions.roles,
]);

const visibleActions = computed(() =>
  filterActionsByPermission(
    filterActionsByContext(props.actions, {
      variant: props.variant,
      selectedCount: props.selectedCount,
    }),
    allowedPermissions.value,
  ),
);

const rowRanked = computed(() =>
  rankTableActions(visibleActions.value, "row", allowedPermissions.value),
);

const ranked = computed(() =>
  props.variant === "toolbar" ? toolbarRanked.value : rowRanked.value,
);

const isPrimary = (action: InTableAction<Row>) => {
  if (props.variant !== "toolbar") {
    return false;
  }
  const never = ranked.value.inline.filter((item) => resolveActionOverflow(item) === "never");
  const last = never[never.length - 1];
  return last?.key === action.key && (action.kind === "quick" || never.length === 1);
};

const readWidths = (): Record<string, number> => {
  const layer = measureRef.value;
  const widths: Record<string, number> = {};
  if (!layer) {
    return widths;
  }
  layer.querySelectorAll<HTMLElement>("[data-action-key]").forEach((el) => {
    const key = el.dataset.actionKey;
    if (key) {
      widths[key] = el.getBoundingClientRect().width;
    }
  });
  return widths;
};

const applyToolbarLayout = () => {
  const host = hostRef.value;
  if (!host) {
    return;
  }
  const measured = host.getBoundingClientRect().width;
  const available = measured > 0 ? measured : Number.POSITIVE_INFINITY;
  const next = layoutToolbarOverflow(available, visibleActions.value, readWidths());
  const current = toolbarRanked.value;
  if (
    sameActionKeys(next.inline, current.inline) &&
    sameActionKeys(next.menu, current.menu) &&
    next.showMore === current.showMore
  ) {
    measuring.value = false;
    return;
  }
  toolbarRanked.value = next;
  measuring.value = false;
};

let resizeObserver: ResizeObserver | undefined;

watch(
  () => [props.variant, visibleActions.value.map((item) => `${item.key}:${item.label}`).join("|")].join("|"),
  async () => {
    if (props.variant !== "toolbar") {
      measuring.value = false;
      return;
    }
    toolbarRanked.value = layoutToolbarOverflow(
      Number.POSITIVE_INFINITY,
      visibleActions.value,
      {},
    );
    measuring.value = true;
    await nextTick();
    applyToolbarLayout();
  },
  { immediate: true },
);

watch(menuOpen, (open) => {
  if (open) {
    document.addEventListener("mousedown", privateOnDocumentPointer);
    return;
  }
  document.removeEventListener("mousedown", privateOnDocumentPointer);
});

onMounted(async () => {
  if (props.variant !== "toolbar") {
    measuring.value = false;
    return;
  }
  await nextTick();
  applyToolbarLayout();
  if (typeof ResizeObserver === "undefined") {
    return;
  }
  const el = hostRef.value;
  if (!el) {
    return;
  }
  resizeObserver = new ResizeObserver(() => {
    applyToolbarLayout();
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  document.removeEventListener("mousedown", privateOnDocumentPointer);
});

const privateCloseMenu = (restoreFocus = false) => {
  menuOpen.value = false;
  activeIndex.value = 0;
  if (restoreFocus) {
    triggerRef.value?.focus();
  }
};

const privateToggleMenu = () => {
  menuOpen.value = !menuOpen.value;
  if (menuOpen.value) {
    activeIndex.value = 0;
    nextTick(() => {
      const items = menuRef.value?.querySelectorAll<HTMLButtonElement>("[role='menuitem']");
      items?.[0]?.focus();
    });
  }
};

const privateOnSelect = async (action: InTableAction<Row>) => {
  if (action.disabled) {
    return;
  }
  privateCloseMenu(true);
  const prompt = resolveActionConfirm(action.confirm);
  if (prompt) {
    await confirm.warning(prompt.message, { title: prompt.title });
  }
  action.onSelect(props.row);
};

const privateOnTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!menuOpen.value) {
      privateToggleMenu();
    }
  }
  if (event.key === "Escape") {
    privateCloseMenu(true);
  }
};

const privateOnMenuKeydown = (event: KeyboardEvent) => {
  const items = ranked.value.menu;
  if (event.key === "Escape") {
    event.preventDefault();
    privateCloseMenu(true);
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % items.length;
    nextTick(() => {
      menuRef.value?.querySelectorAll<HTMLButtonElement>("[role='menuitem']")[activeIndex.value]?.focus();
    });
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value - 1 + items.length) % items.length;
    nextTick(() => {
      menuRef.value?.querySelectorAll<HTMLButtonElement>("[role='menuitem']")[activeIndex.value]?.focus();
    });
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const current = items[activeIndex.value];
    if (current) {
      void privateOnSelect(current);
    }
  }
};

const privateOnDocumentPointer = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }
  if (triggerRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return;
  }
  privateCloseMenu();
};
</script>
<style lang="postcss" scoped>
.in-table-actions {
  @apply inline-flex items-center min-w-0;
  gap: var(--in-space-2);
  position: relative;
}

.in-table-actions.is-toolbar {
  width: 100%;
  justify-content: flex-end;
  gap: var(--in-space-3);
  overflow-x: auto;
}

.in-table-actions.is-measuring .in-table-actions__inline,
.in-table-actions.is-measuring .in-table-actions__more {
  visibility: hidden;
  pointer-events: none;
}

.in-table-actions__measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  gap: var(--in-space-3);
  white-space: nowrap;
}

.in-table-actions__inline {
  height: var(--in-control-height-small);
  padding: 0 var(--in-space-2);
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  color: var(--in-color-primary);
  cursor: pointer;
  font-size: var(--in-font-size-body);
  line-height: var(--in-control-height-small);
}

.in-table-actions__inline.is-toolbar {
  display: inline-flex;
  align-items: center;
  height: var(--in-control-height);
  padding: 0 var(--in-space-3);
  border: 1px solid var(--in-border-color);
  background: var(--in-bg-color-surface);
  color: var(--in-text-color);
  line-height: var(--in-control-height);
  white-space: nowrap;
}

.in-table-actions__inline.is-toolbar.is-primary {
  border-color: var(--in-color-primary);
  background: var(--in-color-primary);
  color: var(--in-text-color-inverse);
}

.in-table-actions__inline.is-danger {
  color: var(--in-color-danger);
}

.in-table-actions__inline.is-toolbar.is-danger {
  border-color: var(--in-color-danger);
  background: var(--in-bg-color-surface);
}

.in-table-actions__inline.is-disabled,
.in-table-actions__item.is-disabled {
  color: var(--in-text-color-disabled);
  cursor: not-allowed;
}

.in-table-actions__icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

.in-table-actions__more {
  position: relative;
}

.in-table-actions__more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--in-icon-button-size);
  height: var(--in-icon-button-size);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  color: var(--in-text-color-secondary);
  cursor: pointer;
}

.in-table-actions__more-btn.is-toolbar {
  border: 1px solid var(--in-border-color);
  background: var(--in-bg-color-surface);
}

.in-table-actions__more-btn:hover {
  background: var(--in-bg-color-hover);
  color: var(--in-text-color);
}

.in-table-actions__more-btn:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-table-actions__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: var(--in-z-dropdown);
  min-width: 112px;
  max-height: 320px;
  overflow: auto;
  padding: var(--in-space-2) var(--in-space-1);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-overlay);
}

.in-table-actions__item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 30px;
  height: 32px;
  padding: 0 var(--in-space-2);
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--in-text-color);
  text-align: left;
  cursor: pointer;
}

.in-table-actions__item.is-active,
.in-table-actions__item:hover:not(.is-disabled) {
  background: var(--in-bg-color-hover);
}

.in-table-actions__item.is-danger {
  color: var(--in-color-danger);
}
</style>
