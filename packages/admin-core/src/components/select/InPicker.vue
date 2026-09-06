<template>
  <span class="in-picker" :class="{ 'is-open': open, 'is-disabled': disabled }">
    <button
      ref="triggerRef"
      type="button"
      class="in-picker__trigger"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="ariaLabel"
      @click="privateToggle"
      @keydown="privateOnTriggerKeydown"
    >
      <span v-if="label" class="in-picker__label">{{ label }}</span>
      <span class="in-picker__value">{{ displayText }}</span>
      <svg
        class="in-picker__caret"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M6.3 8.7a1 1 0 0 1 1.4 0L12 13l4.3-4.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 0 1 0-1.4Z"
          fill="currentColor"
        />
      </svg>
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        class="in-picker__menu"
        role="listbox"
        :aria-label="label || displayText"
        :style="menuStyle"
        @keydown="privateOnMenuKeydown"
      >
        <button
          v-for="(option, index) in options"
          :key="String(option.value)"
          type="button"
          class="in-picker__item"
          :class="{
            'is-selected': isSelected(option.value),
            'is-active': index === activeIndex,
            'is-disabled': option.disabled,
          }"
          role="option"
          :aria-selected="isSelected(option.value)"
          :disabled="option.disabled"
          :tabindex="index === activeIndex ? 0 : -1"
          @click="privateOnSelect(option)"
          @mouseenter="privateOnItemEnter(index)"
        >
          <span>{{ option.label }}</span>
          <svg
            v-if="isSelected(option.value)"
            class="in-picker__check"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 11.293a1 1 0 0 1 1.414 0l4.072 4.07 9.07-9.07a1 1 0 0 1 1.415 0l.706.707a1 1 0 0 1 0 1.414L10.193 18.9a1 1 0 0 1-1.415 0l-5.485-5.485a1 1 0 0 1 0-1.414L4 11.293Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </Teleport>
  </span>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { InPickerOption } from "./types";

defineOptions({
  name: "InPicker",
});

const model = defineModel<string | number | boolean | null>({ default: null });
const props = withDefaults(
  defineProps<{
    label?: string;
    options?: Array<InPickerOption>;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    label: "",
    options: () => [],
    placeholder: "请选择",
    disabled: false,
  },
);
const emits = defineEmits<{
  change: [value: string | number | boolean | null];
}>();

const triggerRef = ref<HTMLButtonElement>();
const menuRef = ref<HTMLElement>();
const open = ref(false);
const activeIndex = ref(0);
const menuStyle = ref<Record<string, string>>({});

const selectedOption = computed(() =>
  props.options.find((item) => item.value === model.value),
);
const displayText = computed(() => selectedOption.value?.label ?? props.placeholder);
const ariaLabel = computed(() =>
  props.label ? `${props.label}，${displayText.value}` : displayText.value,
);

const isSelected = (value: InPickerOption["value"]) => value === model.value;

const privateMenuItems = () => {
  const menu = menuRef.value;
  if (!menu) {
    return [];
  }
  return [...menu.querySelectorAll<HTMLButtonElement>("[role='option']")];
};

const privatePlaceMenu = () => {
  const trigger = triggerRef.value;
  if (!trigger) {
    return;
  }
  const rect = trigger.getBoundingClientRect();
  menuStyle.value = {
    top: `${Math.round(rect.bottom + 4)}px`,
    left: `${Math.round(rect.left)}px`,
    minWidth: `${Math.round(rect.width)}px`,
  };
};

const privateClose = (restoreFocus = false) => {
  open.value = false;
  activeIndex.value = 0;
  if (restoreFocus) {
    triggerRef.value?.focus();
  }
};

const privateOpen = () => {
  if (props.disabled) {
    return;
  }
  const selected = props.options.findIndex((item) => item.value === model.value);
  activeIndex.value = selected >= 0 ? selected : 0;
  open.value = true;
  nextTick(() => {
    privatePlaceMenu();
    privateMenuItems()[activeIndex.value]?.focus();
  });
};

const privateToggle = () => {
  if (open.value) {
    privateClose();
    return;
  }
  privateOpen();
};

const privateOnSelect = (option: InPickerOption) => {
  if (option.disabled) {
    return;
  }
  model.value = option.value;
  emits("change", option.value);
  privateClose(true);
};

const privateOnTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!open.value) {
      privateOpen();
    }
    return;
  }
  if (event.key === "Escape" && open.value) {
    event.preventDefault();
    privateClose(true);
  }
};

const privateOnItemEnter = (index: number) => {
  activeIndex.value = index;
};

const privateOnMenuKeydown = (event: KeyboardEvent) => {
  const items = privateMenuItems();
  if (event.key === "Escape") {
    event.preventDefault();
    privateClose(true);
    return;
  }
  if (!items.length) {
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % items.length;
    nextTick(() => {
      items[activeIndex.value]?.focus();
    });
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value - 1 + items.length) % items.length;
    nextTick(() => {
      items[activeIndex.value]?.focus();
    });
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
  privateClose();
};

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener("mousedown", privateOnDocumentPointer);
    window.addEventListener("scroll", privatePlaceMenu, true);
    window.addEventListener("resize", privatePlaceMenu);
    return;
  }
  document.removeEventListener("mousedown", privateOnDocumentPointer);
  window.removeEventListener("scroll", privatePlaceMenu, true);
  window.removeEventListener("resize", privatePlaceMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", privateOnDocumentPointer);
  window.removeEventListener("scroll", privatePlaceMenu, true);
  window.removeEventListener("resize", privatePlaceMenu);
});
</script>
<style lang="postcss" scoped>
.in-picker {
  display: inline-flex;
  vertical-align: middle;
}

.in-picker + .in-picker {
  margin-inline-start: var(--in-space-3);
}

.in-table__tools-start .in-picker + .in-picker,
.in-table__tools-end .in-picker + .in-picker {
  margin-inline-start: 0;
}

.in-picker__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--in-space-2);
  box-sizing: border-box;
  height: var(--in-control-height);
  padding: 0 var(--in-space-3);
  border: 1px solid #d0d3d6;
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  cursor: pointer;
  color: var(--in-text-color);
  transition: border-color var(--in-motion-duration-split) var(--in-motion-ease-sidebar);
}

.in-picker__trigger:hover:not(:disabled),
.in-picker.is-open .in-picker__trigger {
  border-color: var(--in-color-primary);
}

.in-picker.is-disabled .in-picker__trigger {
  cursor: not-allowed;
  opacity: 0.6;
}

.in-picker__label {
  color: var(--in-text-color-placeholder);
  flex: none;
}

.in-picker__value {
  color: var(--in-text-color);
  min-width: 0;
}

.in-picker__caret {
  width: 12px;
  height: 12px;
  margin-left: 2px;
  color: var(--in-text-color-placeholder);
  flex: none;
  transition: transform var(--in-motion-duration-split) var(--in-motion-ease-sidebar);
}

.in-picker.is-open .in-picker__caret {
  transform: rotate(180deg);
}
</style>
<style lang="postcss">
.in-picker__menu {
  position: fixed;
  z-index: var(--in-z-dropdown);
  box-sizing: border-box;
  padding: var(--in-space-1);
  background: var(--in-bg-color-surface);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  box-shadow: var(--in-shadow-md);
}

.in-picker__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--in-space-3);
  width: 100%;
  min-height: 32px;
  padding: 0 var(--in-space-3);
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  text-align: left;
  cursor: pointer;
}

.in-picker__item.is-active:not(.is-disabled),
.in-picker__item:hover:not(.is-disabled) {
  background: var(--in-bg-color-menu-hover);
}

.in-picker__item.is-selected {
  color: var(--in-color-primary);
}

.in-picker__item.is-disabled {
  cursor: not-allowed;
  color: var(--in-text-color-placeholder);
}

.in-picker__check {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--in-color-primary);
}
</style>
