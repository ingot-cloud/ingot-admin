<template>
  <span v-if="department" class="organization-picker-avatar" aria-hidden="true">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
    >
      <circle cx="12" cy="4" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 6.5V11M5 16.5V11H19V16.5" />
    </svg>
  </span>
  <in-avatar
    class="organization-picker-member-avatar"
    v-else
    :src="src"
    :name="name"
    :show-name="false"
    :size="32"
  />
</template>
<script setup lang="ts">
defineProps<{ name?: string; src?: string; department?: boolean }>();
</script>
<style scoped>
.organization-picker-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--in-color-primary);
  color: var(--in-tag-solid-text-color);
}
.organization-picker-member-avatar {
  --in-text-color-inverse: var(--in-tag-solid-text-color);
}
</style>
