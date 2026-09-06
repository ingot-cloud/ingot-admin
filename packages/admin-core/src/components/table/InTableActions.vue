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

    <template v-for="item in renderItems" :key="item.key">
      <el-tooltip
        v-if="item.action"
        :disabled="!item.action.disabled || !item.action.disabledReason"
        :content="item.action.disabledReason"
        effect="light"
        placement="top"
      >
        <button
          type="button"
          class="in-table-actions__inline"
          :class="{
            'is-toolbar': variant === 'toolbar',
            'is-primary': isPrimary(item.action),
            'is-danger': item.action.kind === 'danger',
            'is-disabled': item.action.disabled,
          }"
          :disabled="item.action.disabled"
          :aria-label="item.action.label"
          :title="item.action.disabled ? item.action.disabledReason : undefined"
          @click="privateOnSelect(item.action)"
        >
          <in-icon v-if="item.action.icon" :name="item.action.icon" class="in-table-actions__icon" />
          {{ item.action.label }}
        </button>
      </el-tooltip>

      <div
        v-else
        class="in-table-actions__more"
        @pointerenter="privateOnMoreEnter"
        @pointerleave="privateOnMoreLeave"
      >
      <button
        :ref="privateSetTriggerRef"
        type="button"
        class="in-table-actions__more-btn"
        :class="{ 'is-toolbar': variant === 'toolbar', 'is-open': menuOpen }"
        aria-label="更多"
        :aria-expanded="menuOpen"
        aria-haspopup="menu"
        @click="privateOnTriggerClick"
        @keydown="privateOnTriggerKeydown"
      >
        <svg
          class="in-table-actions__more-icon"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            v-if="variant === 'toolbar'"
            d="M12 5.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm0 8.225a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm0 8.275a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Z"
            fill="currentColor"
          />
          <path
            v-else
            d="M5.5 11.75a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Zm8.225 0a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Zm8.275 0a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Teleport to="body">
        <div
          v-if="menuOpen"
          :ref="privateSetMenuRef"
          class="in-table-actions__menu"
          role="menu"
          :style="menuStyle"
          @pointerenter="privateOnMoreEnter"
          @pointerleave="privateOnMoreLeave"
          @keydown="privateOnMenuKeydown"
        >
          <div class="in-table-actions__menu-list">
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
      </Teleport>
      </div>
    </template>
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
const menuStyle = ref<Record<string, string>>({});
const activeIndex = ref(0);
let hoverCloseTimer = 0;
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

type RenderItem = {
  key: string;
  action?: InTableAction<Row>;
};

const renderItems = computed((): Array<RenderItem> => {
  const more: RenderItem = { key: "__more" };
  if (props.variant !== "toolbar") {
    const items = ranked.value.inline.map((action) => ({ key: action.key, action }));
    return ranked.value.showMore ? [...items, more] : items;
  }
  const fluid = ranked.value.inline
    .filter((action) => resolveActionOverflow(action) !== "never")
    .map((action) => ({ key: action.key, action }));
  const pinned = ranked.value.inline
    .filter((action) => resolveActionOverflow(action) === "never")
    .map((action) => ({ key: action.key, action }));
  return ranked.value.showMore ? [...fluid, more, ...pinned] : [...fluid, ...pinned];
});

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
    window.addEventListener("scroll", privatePlaceMenu, true);
    window.addEventListener("resize", privatePlaceMenu);
    nextTick(privatePlaceMenu);
    return;
  }
  document.removeEventListener("mousedown", privateOnDocumentPointer);
  window.removeEventListener("scroll", privatePlaceMenu, true);
  window.removeEventListener("resize", privatePlaceMenu);
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
  window.clearTimeout(hoverCloseTimer);
  resizeObserver?.disconnect();
  document.removeEventListener("mousedown", privateOnDocumentPointer);
  window.removeEventListener("scroll", privatePlaceMenu, true);
  window.removeEventListener("resize", privatePlaceMenu);
});

const privateSetTriggerRef = (el: Element | { $el?: unknown } | null) => {
  triggerRef.value = el instanceof HTMLButtonElement ? el : null;
};

const privateSetMenuRef = (el: Element | { $el?: unknown } | null) => {
  menuRef.value = el instanceof HTMLElement ? el : null;
};

const privateMenuItems = () => {
  const menu = menuRef.value;
  if (!menu || typeof menu.querySelectorAll !== "function") {
    return [];
  }
  return [...menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']")];
};

const privatePlaceMenu = () => {
  const trigger = triggerRef.value;
  if (!trigger) {
    return;
  }
  const rect = trigger.getBoundingClientRect();
  menuStyle.value = {
    top: `${Math.round(rect.bottom)}px`,
    right: `${Math.round(window.innerWidth - rect.right)}px`,
  };
};

const privateOpenMenu = (focusFirst = false) => {
  menuOpen.value = true;
  activeIndex.value = 0;
  nextTick(() => {
    privatePlaceMenu();
    if (!focusFirst) {
      return;
    }
    const items = privateMenuItems();
    items[0]?.focus();
  });
};

const privateCloseMenu = (restoreFocus = false) => {
  window.clearTimeout(hoverCloseTimer);
  menuOpen.value = false;
  activeIndex.value = 0;
  if (restoreFocus) {
    triggerRef.value?.focus();
  }
};

const privateOnTriggerClick = () => {
  if (menuOpen.value) {
    return;
  }
  privateOpenMenu(true);
};

const privateOnMoreEnter = (event: PointerEvent) => {
  if (event.pointerType === "touch") {
    return;
  }
  window.clearTimeout(hoverCloseTimer);
  privateOpenMenu(false);
};

const privateOnMoreLeave = (event: PointerEvent) => {
  if (event.pointerType === "touch") {
    return;
  }
  hoverCloseTimer = window.setTimeout(() => {
    privateCloseMenu();
  }, 160);
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
      privateOpenMenu(true);
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
      privateMenuItems()[activeIndex.value]?.focus();
    });
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value - 1 + items.length) % items.length;
    nextTick(() => {
      privateMenuItems()[activeIndex.value]?.focus();
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
  if (triggerRef.value?.contains?.(target) || menuRef.value?.contains?.(target)) {
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
  overflow-y: hidden;
}

.in-table-actions.is-measuring .in-table-actions__inline,
.in-table-actions.is-measuring .in-table-actions__more {
  visibility: hidden;
  pointer-events: none;
}

.in-table-actions__measure {
  position: fixed;
  left: 0;
  top: 0;
  transform: translateY(-100vh);
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

.in-table-actions__more-btn:hover,
.in-table-actions__more-btn.is-open {
  background: var(--in-bg-color-hover);
  color: var(--in-text-color);
}

.in-table-actions__more-btn:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-table-actions__more-icon {
  display: block;
  width: 1em;
  height: 1em;
  font-size: 16px;
}

.in-table-actions__menu {
  position: fixed;
  z-index: var(--in-z-dropdown);
  box-sizing: border-box;
  min-width: 128px;
  padding-top: 4px;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.in-table-actions__menu-list {
  max-height: 320px;
  overflow: auto;
  padding: var(--in-space-2) 0;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-md);
}

.in-table-actions__item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 36px;
  padding: 0 var(--in-space-3);
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  text-align: left;
  white-space: nowrap;
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
