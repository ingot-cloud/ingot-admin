<template>
  <div class="auth-page-loading" :aria-busy="loading">
    <div :inert="loading"><slot /></div>
    <div
      v-if="loading"
      class="auth-page-loading__cover"
      role="status"
      aria-live="polite"
      aria-label="加载中"
    >
      <img class="auth-page-loading__light" :src="loadingLight" alt="" width="64" height="64" />
      <img class="auth-page-loading__dark" :src="loadingDark" alt="" width="64" height="64" />
    </div>
  </div>
</template>

<script setup lang="ts">
import loadingLight from "@ingot/appearance/assets/loading/in-loading-light.svg";
import loadingDark from "@ingot/appearance/assets/loading/in-loading-dark.svg";

defineOptions({ name: "AuthPageLoading" });

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });
</script>

<style scoped lang="postcss">
.auth-page-loading {
  position: relative;
  min-width: 0;
  width: 100%;
}

.auth-page-loading__cover {
  position: absolute;
  inset: -8px;
  z-index: 1;
  display: grid;
  place-items: center;
  border-radius: var(--in-radius-card);
  background: color-mix(in srgb, var(--in-bg-color-surface) 88%, transparent);

  & img {
    grid-area: 1 / 1;
  }

  & .auth-page-loading__dark {
    display: none;
  }
}

html.dark .auth-page-loading__light {
  display: none;
}

html.dark .auth-page-loading__cover .auth-page-loading__dark {
  display: block;
}
</style>
