<template>
  <in-tag
    :value="{ text: label, tag: tone === 'info' ? 'primary' : tone }"
    class="in-status-tag"
    :class="`is-${tone}`"
  >
    <template #icon>
      <span class="in-status-tag__icon" aria-hidden="true">
        <svg
          v-if="tone === 'info'"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.996 22.98c-6.067 0-10.983-4.918-10.983-10.984S5.93 1.013 11.996 1.013c6.066 0 10.983 4.917 10.983 10.983 0 6.066-4.917 10.984-10.983 10.984Z"
            fill="currentColor"
          />
          <path
            d="M17.537 10.746a1.38 1.38 0 0 0-.005-1.95 1.378 1.378 0 0 0-1.95-.005l-4.89 4.89-2.285-2.285a1.375 1.375 0 0 0-1.942.012 1.373 1.373 0 0 0-.013 1.942c1.178 1.175 2.356 2.348 3.53 3.528.392.394 1.03.394 1.422 0 2.037-2.051 4.087-4.09 6.133-6.132Z"
            fill="#fff"
          />
        </svg>
        <svg
          v-else-if="tone === 'warning'"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11ZM7.5 9a1.5 1.5 0 1 1 3 0v6a1.5 1.5 0 0 1-3 0V9Zm6 0a1.5 1.5 0 0 1 3 0v6a1.5 1.5 0 0 1-3 0V9Z"
            fill="currentColor"
            fill-rule="evenodd"
          />
        </svg>
        <svg
          v-else
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22.98c-6.067 0-10.983-4.918-10.983-10.984S5.93 1.013 11.996 1.013c6.066 0 10.983 4.917 10.983 10.983 0 6.066-4.917 10.984-10.983 10.984Z"
            fill="currentColor"
          />
          <path
            d="M12.75 13.25V15a.75.75 0 1 1-1.5 0v-1.75a2 2 0 0 1-1.25-1.837V9.5a2 2 0 1 1 4 0v1.913a2 2 0 0 1-1.25 1.837ZM11 9.5v1.913a.5.5 0 0 0 1 0V9.5a.5.5 0 0 0-1 0Z"
            fill="#fff"
          />
        </svg>
      </span>
    </template>
    <span class="in-status-tag__content">{{ label }}</span>
  </in-tag>
</template>
<script lang="ts" setup>
import InTag from "../tag/InTag.vue";

defineOptions({
  name: "StatusTag",
});

defineProps<{
  tone: "info" | "warning" | "danger";
  label: string;
}>();
</script>
<style lang="postcss" scoped>
.in-status-tag {
  --in-tag-height: var(--in-status-tag-height);
  --in-tag-radius: var(--in-status-tag-radius);
  --in-tag-primary-color: var(--in-status-tag-info-color);
  --in-tag-primary-bg: var(--in-status-tag-info-bg);
  --in-tag-warning-color: var(--in-status-tag-warning-color);
  --in-tag-warning-bg: var(--in-status-tag-warning-bg);
  --in-tag-danger-color: var(--in-status-tag-danger-color);
  --in-tag-danger-bg: var(--in-status-tag-danger-bg);
  width: max-content;
  max-width: none;
  margin: 0;
}

.in-status-tag__icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 1em;
  height: 1em;
}

.in-status-tag__icon svg {
  display: block;
  width: 1em;
  height: 1em;
}

.in-status-tag__content {
  flex-shrink: 0;
}
</style>
