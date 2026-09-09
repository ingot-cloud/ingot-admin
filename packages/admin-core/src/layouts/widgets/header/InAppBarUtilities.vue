<template>
  <div class="in-app-bar-utilities" data-testid="app-bar-utilities">
    <template v-for="item in items" :key="item.key">
      <Teleport :disabled="!overflowedSet.has(item.key)" :to="overflowTarget">
        <div
          class="in-app-bar-utilities__item"
          :class="{ 'is-overflow': overflowedSet.has(item.key) }"
          :data-utility-key="item.key"
        >
          <template
            v-if="
              item.type === InAdminHeaderUtilityItemType.Builtin &&
              item.name === InAdminHeaderBuiltinUtilityName.Fullscreen
            "
          >
            <el-tooltip
              :disabled="overflowedSet.has(item.key)"
              :content="item.label"
              effect="light"
              placement="bottom"
            >
              <span class="in-app-bar-utilities__builtin">
                <in-fullscreen />
                <span v-if="overflowedSet.has(item.key)">{{ item.label }}</span>
              </span>
            </el-tooltip>
          </template>
          <template
            v-else-if="
              item.type === InAdminHeaderUtilityItemType.Builtin &&
              item.name === InAdminHeaderBuiltinUtilityName.Settings
            "
          >
            <el-tooltip
              :disabled="overflowedSet.has(item.key)"
              :content="item.label"
              effect="light"
              placement="bottom"
            >
              <span class="in-app-bar-utilities__builtin">
                <in-global-setting />
                <span v-if="overflowedSet.has(item.key)">{{ item.label }}</span>
              </span>
            </el-tooltip>
          </template>
          <template v-else-if="item.type === InAdminHeaderUtilityItemType.Component && item.component">
            <component
              :is="item.component"
              :overflowed="overflowedSet.has(item.key)"
              :disabled="item.disabled"
            />
          </template>
          <el-tooltip
            v-else
            :disabled="overflowedSet.has(item.key) || !item.label"
            :content="item.label"
            effect="light"
            placement="bottom"
          >
            <button
              type="button"
              class="in-icon-button in-app-bar-utilities__action"
              :class="{ 'is-overflow': overflowedSet.has(item.key) }"
              :aria-label="item.label"
              :disabled="item.disabled || pendingKey === item.key"
              @click="privateOnAction(item)"
            >
              <span class="in-app-bar-utilities__icon-wrap">
                <in-icon v-if="item.icon" :name="item.icon" class="in-app-bar__icon" />
                <span v-if="privateBadgeVisible(item.badge)" class="in-app-bar__badge">{{
                  item.badge
                }}</span>
              </span>
              <span v-if="overflowedSet.has(item.key)">{{ item.label }}</span>
            </button>
          </el-tooltip>
        </div>
      </Teleport>
    </template>

    <Teleport :disabled="!overflowUtilitySlot" :to="overflowTarget">
      <div
        v-if="hasUtilitySlot"
        ref="slotRef"
        class="in-app-bar-utilities__extra"
        :class="{ 'is-overflow': overflowUtilitySlot }"
      >
        <slot name="header-end" />
        <slot name="utilities" />
      </div>
    </Teleport>

    <el-tooltip
      v-if="showMore"
      :disabled="moreOpen"
      content="更多"
      effect="light"
      placement="bottom"
    >
      <button
        ref="moreTriggerRef"
        type="button"
        class="in-icon-button"
        aria-label="更多"
        :aria-expanded="moreOpen"
        aria-haspopup="menu"
        @click="privateToggleMore"
      >
        <in-icon name="ep:more" class="in-app-bar__icon" />
      </button>
    </el-tooltip>

    <div
      ref="morePanelRef"
      class="in-app-bar-overlay"
      :class="{ 'is-open': moreOpen }"
      role="menu"
      aria-label="更多功能"
      tabindex="-1"
      :aria-hidden="!moreOpen"
      :style="morePanelStyle"
      @keydown="privateOnMoreKeydown"
    >
      <div ref="overflowPoolRef" class="in-app-bar-utilities__overflow-pool"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMessage } from "@/hooks/web/useMessage";
import {
  InAdminHeaderBuiltinUtilityName,
  InAdminHeaderUtilityItemType,
} from "@/plugin/header";
import type { ResolvedHeaderUtilityItem } from "./resolveHeaderConfig";
import { isVisibleUtilityBadge } from "./isVisibleUtilityBadge";
import { useAppBarOverlay } from "./useAppBarOverlay";

defineOptions({
  name: "InAppBarUtilities",
});

const props = defineProps<{
  items: ResolvedHeaderUtilityItem[];
  visibleKeys: string[];
  overflowKeys: string[];
  showMore: boolean;
  overflowUtilitySlot: boolean;
}>();

const emit = defineEmits<{
  "open-panel": [id: string];
  "close-panel": [];
}>();

const slots = defineSlots<{
  "header-end"?: () => unknown;
  utilities?: () => unknown;
}>();

const message = useMessage();
const pendingKey = ref<string>();
const moreOpen = ref(false);
const moreTriggerRef = ref<HTMLElement>();
const morePanelRef = ref<HTMLElement>();
const overflowPoolRef = ref<HTMLElement>();
const slotRef = ref<HTMLElement>();

const overflowedSet = computed(() => new Set(props.overflowKeys));
const hasUtilitySlot = computed(() => Boolean(slots["header-end"]) || Boolean(slots.utilities));
const overflowTarget = computed(() => overflowPoolRef.value ?? "body");
const privateBadgeVisible = isVisibleUtilityBadge;

const { panelStyle: morePanelStyle, privateToggle, privateClose, privatePlacePanel } =
  useAppBarOverlay({
    open: moreOpen,
    triggerRef: moreTriggerRef,
    panelRef: morePanelRef,
  });

const privateOnAction = async (item: ResolvedHeaderUtilityItem) => {
  if (item.disabled || !item.onClick || pendingKey.value) {
    return;
  }
  pendingKey.value = item.key;
  try {
    await item.onClick();
  } catch (error) {
    const text = error instanceof Error ? error.message : "操作失败";
    message.error(text);
  } finally {
    pendingKey.value = undefined;
  }
};

const privateToggleMore = () => {
  if (moreOpen.value) {
    emit("close-panel");
    privateClose(true);
    return;
  }
  emit("open-panel", "utility-more");
  privateToggle();
};

const privateOnMoreKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close-panel");
    privateClose(true);
  }
};

watch(
  () => props.showMore,
  (show) => {
    if (!show && moreOpen.value) {
      moreOpen.value = false;
      emit("close-panel");
    }
  },
);

watch(moreOpen, (open) => {
  if (open) {
    nextTick(() => privatePlacePanel());
  }
});

const close = () => {
  if (moreOpen.value) {
    privateClose();
    emit("close-panel");
  }
};

defineExpose({
  slotRef,
  moreTriggerRef,
  close,
  focusMore: () => moreTriggerRef.value?.focus(),
});
</script>
<style lang="postcss" scoped>
.in-app-bar-utilities {
  @apply flex items-center min-w-0 relative;
  flex: none;
  gap: var(--in-space-3);
}

.in-app-bar-utilities__item,
.in-app-bar-utilities__extra,
.in-app-bar-utilities__builtin {
  @apply inline-flex items-center min-w-0;
  gap: var(--in-space-2);
}

.in-app-bar-utilities__item.is-overflow,
.in-app-bar-utilities__action.is-overflow,
.in-app-bar-utilities__extra.is-overflow {
  width: 100%;
  max-width: 280px;
  justify-content: flex-start;
}

.in-app-bar-utilities__action {
  position: relative;
}

.in-app-bar-utilities__icon-wrap {
  position: relative;
  display: inline-flex;
  flex: none;
}

.in-app-bar__badge {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: var(--in-color-danger);
  color: var(--in-text-color-inverse);
  font-size: 10px;
  line-height: 14px;
  transform: translate(40%, -40%);
  pointer-events: none;
}

.in-app-bar-overlay {
  position: fixed;
  z-index: var(--in-z-dropdown);
  box-sizing: border-box;
  min-width: 160px;
  max-width: 280px;
  padding: var(--in-space-1);
  overflow-x: hidden;
  overflow-y: auto;
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

.in-app-bar-utilities__overflow-pool {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-1);
}
</style>
