<template>
  <div class="in-loading">
    <div class="in-loading__content">
      <slot />
    </div>
    <div
      v-if="loading"
      class="in-loading__cover"
      role="status"
      aria-live="polite"
      :aria-label="hint"
    >
      <in-loading-mark :size="size" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import InLoadingMark from "./InLoadingMark.vue";

defineOptions({
  name: "InLoading",
});

withDefaults(
  defineProps<{
    loading?: boolean;
    hint?: string;
    size?: number;
  }>(),
  {
    loading: false,
    hint: "加载中",
    size: 64,
  },
);
</script>
<style lang="postcss" scoped>
.in-loading {
  position: relative;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.in-loading__content {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
}

.in-loading__content > :only-child {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.in-loading__cover {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  pointer-events: auto;
}
</style>
