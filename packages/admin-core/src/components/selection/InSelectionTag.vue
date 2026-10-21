<template>
  <span
    class="in-selection-tag"
    :class="{
      'has-avatar': hasAvatar,
      'is-closable': canClose,
      'is-disabled': disabled,
    }"
    :style="tagStyle"
    :title="name"
  >
    <span v-if="hasAvatar" class="in-selection-tag__avatar">
      <slot name="avatar">
        <in-avatar :name="name" :src="avatar" :show-name="false" />
      </slot>
    </span>
    <span class="in-selection-tag__name">
      <slot>{{ name }}</slot>
    </span>
    <span v-if="slots.suffix" class="in-selection-tag__suffix" @click.stop>
      <slot name="suffix" />
    </span>
    <in-close-button
      v-if="canClose"
      class="in-selection-tag__close"
      size="sm"
      :label="closeLabel || `移除 ${name}`"
      @click="emits('close')"
    />
  </span>
</template>
<script lang="ts" setup>
import InAvatar from "../avatar/InAvatar.vue";
import InCloseButton from "../InCloseButton.vue";

defineOptions({
  name: "InSelectionTag",
});

const props = withDefaults(
  defineProps<{
    /** 标签名称，同时用于头像缩写与默认删除按钮文案。 */
    name?: string;
    /** 头像图片地址，缺省时显示主题色圆形与名字最后一位。 */
    avatar?: string;
    /** 是否显示头像区。 */
    showAvatar?: boolean;
    /** 是否显示删除按钮。 */
    closable?: boolean;
    /** 禁用时隐藏删除按钮并弱化展示。 */
    disabled?: boolean;
    /** 覆盖标签背景色，默认使用 `--in-selection-tag-bg`。 */
    background?: string;
    /** 覆盖头像尺寸（px），默认使用 `--in-selection-tag-avatar-size`。 */
    avatarSize?: number;
    /** 删除按钮的无障碍文案，默认「移除 {name}」。 */
    closeLabel?: string;
  }>(),
  {
    name: "",
    showAvatar: true,
    closable: false,
    disabled: false,
  },
);

const slots = defineSlots<{
  default?: () => unknown;
  avatar?: () => unknown;
  suffix?: () => unknown;
}>();

const emits = defineEmits<{
  close: [];
}>();

const hasAvatar = computed(() => props.showAvatar || Boolean(slots.avatar));
const canClose = computed(() => props.closable && !props.disabled);
const tagStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.background) {
    style["--in-selection-tag-bg"] = props.background;
  }
  if (props.avatarSize) {
    style["--in-selection-tag-avatar-size"] = `${props.avatarSize}px`;
  }
  return Object.keys(style).length > 0 ? style : undefined;
});
</script>
<style lang="postcss" scoped>
.in-selection-tag {
  --in-avatar-size: var(--in-selection-tag-avatar-size);
  --in-text-color-inverse: var(--in-tag-solid-text-color);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--in-space-1);
  max-width: 100%;
  min-width: 0;
  height: var(--in-selection-tag-height);
  padding: 0 var(--in-space-2);
  border-radius: var(--in-selection-tag-radius);
  background: var(--in-selection-tag-bg);
  color: var(--in-text-color);
  font-size: var(--in-tag-font-size);
  line-height: 1;
  vertical-align: middle;
}

.in-selection-tag.has-avatar {
  padding-left: calc((var(--in-selection-tag-height) - var(--in-selection-tag-avatar-size)) / 2);
  border-radius: calc(var(--in-selection-tag-height) / 2);
}

.in-selection-tag.is-closable {
  padding-right: var(--in-space-1);
}

.in-selection-tag.is-disabled {
  color: var(--in-text-color-secondary);
}

.in-selection-tag__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--in-selection-tag-avatar-size);
  height: var(--in-selection-tag-avatar-size);
  overflow: hidden;
  border-radius: 50%;
}

.in-selection-tag__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.in-selection-tag__suffix {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--in-space-1);
}

.in-selection-tag__suffix:empty {
  display: none;
}

.in-selection-tag__close {
  flex-shrink: 0;
}
</style>
