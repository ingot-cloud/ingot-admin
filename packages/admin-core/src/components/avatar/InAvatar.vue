<template>
  <span v-if="hasContent" class="in-avatar-field">
    <span
      v-if="showAvatar"
      class="in-avatar"
      :style="avatarColorStyle"
      aria-hidden="true"
    >
      <img
        v-if="showImage"
        class="in-avatar__image"
        :src="resolvedSrc"
        :alt="name || ''"
        @error="privateOnImageError"
      />
      <span v-else class="in-avatar__fallback">{{ initials }}</span>
    </span>
    <span v-if="hasName" class="in-avatar-field__name">
      <slot>{{ name }}</slot>
    </span>
  </span>
</template>
<script lang="ts" setup>
import { avatarInitials } from "./avatarInitials";

defineOptions({
  name: "InAvatar",
});

const props = withDefaults(
  defineProps<{
    name?: string;
    src?: string;
    avatar?: string;
    showAvatar?: boolean;
    color?: string;
  }>(),
  {
    showAvatar: true,
  },
);

const slots = defineSlots<{
  default?: () => unknown;
}>();

const imageFailed = ref(false);
const resolvedSrc = computed(() => props.src || props.avatar || "");
const showImage = computed(() => Boolean(resolvedSrc.value) && !imageFailed.value);
const initials = computed(() => avatarInitials(props.name));
const hasName = computed(() => Boolean(props.name?.trim()) || Boolean(slots.default));
const hasContent = computed(() => props.showAvatar || hasName.value);
const avatarColorStyle = computed(() =>
  props.color ? { "--in-avatar-color": props.color } : undefined,
);

watch(resolvedSrc, () => {
  imageFailed.value = false;
});

const privateOnImageError = (): void => {
  imageFailed.value = true;
};
</script>
<style lang="postcss" scoped>
.in-avatar-field {
  @apply inline-flex items-center min-w-0;
  gap: var(--in-space-2);
  vertical-align: middle;
}

.in-avatar {
  box-sizing: border-box;
  display: inline-block;
  flex-shrink: 0;
  width: var(--in-avatar-size);
  height: var(--in-avatar-size);
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
  list-style: none;
  font-size: var(--in-font-size-body);
  font-variant: tabular-nums;
  font-weight: var(--in-font-weight-section-title);
  line-height: 1;
  vertical-align: middle;
  border-radius: 50%;
  background: var(--in-avatar-color, var(--in-color-primary));
  color: var(--in-text-color-inverse);
}

.in-avatar__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.in-avatar__fallback {
  @apply inline-flex items-center justify-center w-full h-full;
  font-size: var(--in-font-size-caption);
  user-select: none;
}

.in-avatar-field__name {
  @apply min-w-0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}
</style>
