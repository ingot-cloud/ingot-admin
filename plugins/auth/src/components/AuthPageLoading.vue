<template>
  <div class="auth-page-loading">
    <slot />
    <div v-if="loading" class="auth-page-loading__cover" role="status" aria-live="polite" aria-label="加载中" />
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: "AuthPageLoading" });

withDefaults(
  defineProps<{
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);
</script>

<style lang="postcss" scoped>
.auth-page-loading {
  position: relative;
  min-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.auth-page-loading > :not(.auth-page-loading__cover) {
  flex: 1 1 auto;
  min-width: 0;
}

.auth-page-loading__cover {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(255, 255, 255, 0.55);
}
</style>
