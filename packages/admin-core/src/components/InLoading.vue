<template>
  <div class="in-loading">
    <div class="in-loading__content">
      <slot />
    </div>
    <in-loading-mark v-if="loading" :size="size" :overlay="overlay" :hint="hint" />
  </div>
</template>
<script lang="ts" setup>
import InLoadingMark from "./InLoadingMark.vue";
import type { InLoadingOverlay } from "./types";

defineOptions({
  name: "InLoading",
});

withDefaults(
  defineProps<{
    loading?: boolean;
    hint?: string;
    size?: number;
    /** 罩住当前容器，或提到全屏。 */
    overlay?: Exclude<InLoadingOverlay, "none">;
  }>(),
  {
    loading: false,
    hint: "加载中",
    size: 64,
    overlay: "local",
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
</style>
