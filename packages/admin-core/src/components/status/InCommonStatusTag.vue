<template>
  <span v-if="tone" class="in-status-tag" :class="`is-${tone}`">
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
        v-else
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
    </span>
    <span class="in-status-tag__content">{{ label }}</span>
  </span>
</template>
<script lang="ts" setup>
import { CommonStatus } from "@/models/enums";
import { resolveCommonStatus } from "./resolveCommonStatus";

defineOptions({
  name: "InCommonStatusTag",
});

const props = defineProps<{
  status?: CommonStatus | string | number | null;
}>();

const resolvedStatus = computed(() => resolveCommonStatus(props.status));

const tone = computed<"info" | "warning" | undefined>(() => {
  if (resolvedStatus.value === CommonStatus.Enable) {
    return "info";
  }
  if (resolvedStatus.value === CommonStatus.Lock) {
    return "warning";
  }
  return undefined;
});

const label = computed(() => {
  if (resolvedStatus.value === CommonStatus.Enable) {
    return "正常";
  }
  if (resolvedStatus.value === CommonStatus.Lock) {
    return "已锁定";
  }
  return "";
});
</script>
<style lang="postcss" scoped>
.in-status-tag {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  flex-shrink: 0;
  width: max-content;
  max-width: none;
  margin: 0;
  padding: 0 var(--in-space-2) 0 var(--in-space-1);
  height: var(--in-status-tag-height);
  gap: var(--in-space-1);
  border-radius: var(--in-status-tag-radius);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-section-title);
  font-variant: tabular-nums;
  line-height: 1.5715;
  white-space: nowrap;
  vertical-align: middle;
  list-style: none;
  transition: all var(--in-motion-duration) var(--in-motion-ease);
}

.in-status-tag.is-info {
  background-color: var(--in-status-tag-info-bg);
  color: var(--in-status-tag-info-color);
}

.in-status-tag.is-warning {
  background-color: var(--in-status-tag-warning-bg);
  color: var(--in-status-tag-warning-color);
}

.in-status-tag__icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  font-size: 14px;
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
