<template>
  <div
    class="in-selection-field"
    :class="{
      'is-disabled': disabled,
      'is-small': size === 'small',
      'has-icon': hasIcon,
    }"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-label="ariaLabel || placeholder"
    :aria-disabled="disabled"
    @click="privateOpen"
    @keydown.enter.self.prevent="privateOpen"
    @keydown.space.self.prevent="privateOpen"
  >
    <div class="in-selection-field__content" :class="wrap ? 'is-wrap' : 'is-nowrap'">
      <slot name="prefix" />
      <template v-for="item in shown" :key="item.id">
        <slot name="tag" :item="item" :remove="() => privateRemove(item)">
          <in-selection-tag
            :name="item.name"
            :avatar="item.avatar"
            :show-avatar="showAvatar"
            :closable="item.closable ?? closable"
            :disabled="disabled"
            :background="tagBackground"
            @close="privateRemove(item)"
          >
            <template v-if="slots['tag-avatar']" #avatar>
              <slot name="tag-avatar" :item="item" />
            </template>
            <template v-if="slots['tag-name']" #default>
              <slot name="tag-name" :item="item" />
            </template>
            <template v-if="slots['tag-suffix']" #suffix>
              <slot name="tag-suffix" :item="item" />
            </template>
          </in-selection-tag>
        </slot>
      </template>
      <span v-if="extra > 0" class="in-selection-field__more">+{{ extra }}</span>
      <span v-if="isEmpty" class="in-selection-field__placeholder">
        <slot name="empty">{{ placeholder }}</slot>
      </span>
    </div>
    <span v-if="hasIcon" class="in-selection-field__icon" aria-hidden="true">
      <slot name="icon">
        <in-icon v-if="icon" :name="icon" />
      </slot>
    </span>
  </div>
</template>
<script lang="ts" setup generic="T extends InSelectionItem">
import InIcon from "../InIcon.vue";
import InSelectionTag from "./InSelectionTag.vue";
import { selectionOverflowCount, visibleSelection } from "./selectionOverflow";
import type { InSelectionFieldSize, InSelectionItem } from "./types";

defineOptions({
  name: "InSelectionField",
});

const props = withDefaults(
  defineProps<{
    /** 已选内容。 */
    items?: T[];
    /** 是否允许删除已选项，单项 `closable` 优先。 */
    closable?: boolean;
    /** 标签是否显示头像。 */
    showAvatar?: boolean;
    /** 服务端总数，用于计算 `+N`；缺省时取 `items.length`。 */
    total?: number;
    /** 最多展示的标签数，缺省时全部展示。 */
    maxVisible?: number;
    /** 是否换行展示；为 false 时单行截断。 */
    wrap?: boolean;
    /** 无已选内容时的占位文案。 */
    placeholder?: string;
    /** 右侧图标，传 false 隐藏。 */
    icon?: string | false;
    /** 禁用时不响应点击、不显示删除。 */
    disabled?: boolean;
    /** 覆盖标签背景色。 */
    tagBackground?: string;
    /** 录入框尺寸。 */
    size?: InSelectionFieldSize;
    /** 无障碍名称，缺省使用 placeholder。 */
    ariaLabel?: string;
  }>(),
  {
    items: () => [],
    closable: false,
    showAvatar: true,
    wrap: true,
    placeholder: "请选择",
    icon: "ep:edit",
    disabled: false,
    size: "default",
  },
);

const slots = defineSlots<{
  tag?: (props: { item: T; remove: () => void }) => unknown;
  "tag-avatar"?: (props: { item: T }) => unknown;
  "tag-name"?: (props: { item: T }) => unknown;
  "tag-suffix"?: (props: { item: T }) => unknown;
  prefix?: () => unknown;
  empty?: () => unknown;
  icon?: () => unknown;
}>();

const emits = defineEmits<{
  click: [];
  remove: [item: T];
}>();

const shown = computed(() => visibleSelection(props.items, props.maxVisible));
const extra = computed(() =>
  selectionOverflowCount(props.total ?? props.items.length, shown.value.length),
);
const isEmpty = computed(() => !shown.value.length && extra.value <= 0);
const hasIcon = computed(() => Boolean(props.icon) || Boolean(slots.icon));

const privateOpen = (): void => {
  if (props.disabled) return;
  emits("click");
};

const privateRemove = (item: T): void => {
  if (props.disabled) return;
  emits("remove", item);
};
</script>
<style lang="postcss" scoped>
.in-selection-field {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: var(--in-control-height);
  padding: 3px var(--in-space-1);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.in-selection-field.has-icon {
  padding-right: 32px;
}

.in-selection-field.is-small {
  min-height: var(--in-control-height-small);
  padding-top: 1px;
  padding-bottom: 1px;
}

.in-selection-field:hover,
.in-selection-field:focus-visible {
  border-color: var(--in-color-primary);
}

.in-selection-field.is-disabled {
  border-color: var(--in-border-color);
  background: var(--in-bg-color-subtle);
  cursor: not-allowed;
}

.in-selection-field.is-disabled .in-selection-field__content,
.in-selection-field.is-disabled .in-selection-field__icon {
  opacity: 0.6;
}

.in-selection-field__content {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--in-space-1);
  min-width: 0;
}

.in-selection-field__content.is-wrap {
  flex-wrap: wrap;
}

.in-selection-field__content.is-nowrap {
  flex-wrap: nowrap;
  overflow: hidden;
}

.in-selection-field__content > :deep(.in-selection-tag) {
  flex-shrink: 0;
  max-width: 100%;
}

.in-selection-field__content.is-nowrap > :deep(.in-selection-tag) {
  flex-shrink: 1;
}

.in-selection-field__more {
  flex-shrink: 0;
  padding: 0 var(--in-space-1);
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
}

.in-selection-field__placeholder {
  min-width: 0;
  padding: 0 var(--in-space-2);
  overflow: hidden;
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.in-selection-field__icon {
  position: absolute;
  top: 50%;
  right: var(--in-space-2);
  display: inline-flex;
  color: var(--in-text-color-secondary);
  transform: translateY(-50%);
}
</style>
