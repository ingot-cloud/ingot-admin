<template>
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      v-if="vertical"
      d="M12 5.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm0 8.225a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm0 8.275a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Z"
      fill="currentColor"
    />
    <path
      v-else
      d="M5.5 11.75a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Zm8.225 0a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Zm8.275 0a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Z"
      fill="currentColor"
    />
  </svg>
</template>
<script lang="ts" setup>
defineOptions({
  name: "IconMoreOutlined",
});

withDefaults(
  defineProps<{
    vertical?: boolean;
  }>(),
  {
    vertical: false,
  },
);
</script>
