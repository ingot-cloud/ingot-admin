<template>
  <span
    class="dept-mark"
    :class="{ 'is-glyph': variant === 'glyph' }"
    :style="{ '--department-mark-size': `${size}px` }"
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.304 16.5h11.392c.25-.15.52-.27.804-.355v-2.146a1 1 0 0 0-1-1h-11a1 1 0 0 0-1 1v2.146c.285.085.555.205.804.355ZM3.5 16.145v-2.146a3 3 0 0 1 3-3H11V8.873a4 4 0 1 1 2 0v2.126h4.5a3 3 0 0 1 3 3v2.146a3.5 3.5 0 1 1-2.804.355H6.304a3.5 3.5 0 1 1-2.804-.355ZM12 6.999a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM19.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="currentColor"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
defineOptions({ name: "DepartmentMark" });

withDefaults(
  defineProps<{
    /** badge 为选择框圆标，glyph 为录入框标签里的小图标。 */
    variant?: "badge" | "glyph";
    size?: number;
  }>(),
  { variant: "badge", size: 28 },
);
</script>

<style lang="postcss" scoped>
.dept-mark {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--department-mark-size);
  height: var(--department-mark-size);
  border-radius: 50%;
  background: var(--in-color-primary);
  color: var(--in-tag-solid-text-color);
}

.dept-mark svg {
  width: 57%;
  height: 57%;
}

.dept-mark.is-glyph {
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: none;
  color: var(--in-text-color);
}
.dept-mark.is-glyph svg {
  width: 16px;
  height: 16px;
}
</style>
