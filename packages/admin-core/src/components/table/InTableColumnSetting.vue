<template>
  <span class="in-table-column-setting">
    <el-tooltip :disabled="open" content="按需自定义展示或隐藏字段" effect="dark" placement="top">
      <button
        ref="triggerRef"
        type="button"
        class="in-table-column-setting__trigger"
        aria-label="设置显示字段"
        :aria-expanded="open"
        @click="privateToggle"
        @keydown="privateOnTriggerKeydown"
      >
        <svg
          class="in-table-column-setting__icon"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12.5 3.5h-4v14h1v2H2.545A2.045 2.045 0 0 1 .5 17.456V3.545A2.045 2.045 0 0 1 2.545 1.5h15.91A2.045 2.045 0 0 1 20.5 3.545v5.151l-2-1.155V3.545a.04.04 0 0 0-.003-.016.049.049 0 0 0-.025-.026.04.04 0 0 0-.017-.002H14.5v4.958l-2 1.155V3.5Zm-9.956 0a.04.04 0 0 0-.016.002.048.048 0 0 0-.025.026.04.04 0 0 0-.003.017v13.91c0 .01.002.014.002.017l.011.014a.039.039 0 0 0 .014.01.039.039 0 0 0 .018.004H6.5v-14H2.545ZM17.5 11.31l4.062 2.345v4.69L17.5 20.69l-4.062-2.345v-4.691L17.5 11.31Zm.5-2.021a1 1 0 0 0-1 0l-5.062 2.922a1 1 0 0 0-.5.867v5.845a1 1 0 0 0 .5.866L17 22.71a1 1 0 0 0 1 0l5.062-2.922a1 1 0 0 0 .5-.867v-5.845a1 1 0 0 0-.5-.866L18 9.29ZM19.5 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </el-tooltip>
    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="in-table-column-setting__panel"
        role="dialog"
        aria-label="字段显示设置"
        :style="panelStyle"
        @keydown="privateOnPanelKeydown"
      >
        <p class="in-table-column-setting__hint">请选择列表中要展示的信息</p>
        <label class="in-table-column-setting__item is-all">
          <input
            type="checkbox"
            :checked="allChecked"
            :indeterminate.prop="allIndeterminate"
            @change="privateOnToggleAll"
          />
          <span>全部</span>
        </label>
        <div class="in-table-column-setting__list">
          <label
            v-for="item in orderedHeaders"
            :key="String(item.prop)"
            class="in-table-column-setting__item"
            :class="{
              'is-locked': isTableHeaderLocked(item),
              'is-over': dragOverProp === String(item.prop),
              'is-dragging': draggingProp === String(item.prop),
            }"
            @dragover="privateOnDragOver(String(item.prop), $event)"
            @drop="privateOnDrop(String(item.prop), $event)"
            @dragleave="privateOnDragLeave(String(item.prop))"
          >
            <input
              type="checkbox"
              :checked="selectedProps.includes(String(item.prop))"
              :disabled="isTableHeaderLocked(item)"
              @change="privateOnToggle(String(item.prop))"
            />
            <span class="in-table-column-setting__label">{{ item.label }}</span>
            <span
              v-if="canReorderTableHeader(item)"
              class="in-table-column-setting__handle"
              draggable="true"
              role="button"
              aria-label="调整顺序"
              @click.stop
              @dragstart="privateOnDragStart(String(item.prop), $event)"
              @dragend="privateOnDragEnd"
            >
              <svg
                width="1em"
                height="1em"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="5" cy="3" r="1.15" />
                <circle cx="11" cy="3" r="1.15" />
                <circle cx="5" cy="8" r="1.15" />
                <circle cx="11" cy="8" r="1.15" />
                <circle cx="5" cy="13" r="1.15" />
                <circle cx="11" cy="13" r="1.15" />
              </svg>
            </span>
          </label>
        </div>
      </div>
    </Teleport>
  </span>
</template>
<script lang="ts" setup>
import type { TableHeaderRecord } from "./types";
import { canReorderTableHeader, isTableHeaderLocked } from "./columnVisibility";
import { useTableColumnSetting } from "./useTableColumnSetting";

defineOptions({
  name: "InTableColumnSetting",
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

const {
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
} = useTableColumnSetting(props, emits);
</script>
<style lang="postcss" scoped>
.in-table-column-setting {
  display: inline-flex;
  overflow: visible;
}

.in-table-column-setting__trigger {
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

.in-table-column-setting__trigger:hover {
  background: var(--in-bg-color-hover);
  color: var(--in-text-color);
}

.in-table-column-setting__trigger:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-table-column-setting__icon {
  display: block;
  width: 16px;
  height: 16px;
}
</style>
<style lang="postcss">
/* 浮层 Teleport 到 body，样式不能依赖 scoped 父级，否则会被 InTable / Split 裁成一条窄白条 */
.in-table-column-setting__panel {
  position: fixed;
  z-index: var(--in-z-dropdown);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 213px;
  min-width: 213px;
  max-height: 426px;
  padding: var(--in-space-2) 0;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-md);
}

.in-table-column-setting__hint {
  margin: 0;
  padding: var(--in-space-1) var(--in-space-3) var(--in-space-2);
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-body);
}

.in-table-column-setting__list {
  overflow: auto;
  min-height: 0;
  flex: 1;
}

.in-table-column-setting__item {
  display: flex;
  align-items: center;
  gap: var(--in-space-2);
  min-height: 36px;
  padding: 0 var(--in-space-3);
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  cursor: pointer;
  user-select: none;
}

.in-table-column-setting__item:hover,
.in-table-column-setting__item.is-over {
  background: var(--in-bg-color-hover);
}

.in-table-column-setting__item.is-dragging {
  opacity: 0.6;
}

.in-table-column-setting__item.is-all {
  border-bottom: 1px solid var(--in-border-color);
  margin-bottom: var(--in-space-1);
}

.in-table-column-setting__item.is-locked {
  color: var(--in-text-color-secondary);
  cursor: not-allowed;
}

.in-table-column-setting__item input {
  width: 16px;
  height: 16px;
  margin: 0;
  flex: none;
  accent-color: var(--in-color-primary);
}

.in-table-column-setting__label {
  flex: 1;
  min-width: 0;
}

.in-table-column-setting__handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: auto;
  color: var(--in-text-color-placeholder);
  cursor: grab;
}

.in-table-column-setting__handle:active {
  cursor: grabbing;
}

.in-table-column-setting__handle svg {
  display: block;
  width: 16px;
  height: 16px;
  pointer-events: none;
}
</style>
