<template>
  <div class="in-global-loading" role="status" aria-live="polite" :aria-label="hint">
    <div class="in-global-loading-box" aria-hidden="true">
      <img class="in-global-loading-mark" :src="loadingSrc" alt="" width="96" height="96" />
      <div class="in-global-loading-text">
        <span>{{ hintLabel }}</span>
        <span class="in-global-loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDark } from "@vueuse/core";
import loadingDark from "../assets/loading/in-loading-dark.svg";
import loadingLight from "../assets/loading/in-loading-light.svg";

defineOptions({
  name: "InGlobalLoading",
});

const props = withDefaults(
  defineProps<{
    hint?: string;
  }>(),
  {
    hint: "加载中...",
  },
);

const isDark = useDark();
const loadingSrc = computed(() => (isDark.value ? loadingDark : loadingLight));
const hintLabel = computed(() => props.hint.replace(/\.+$/u, ""));
</script>
<style lang="postcss" scoped>
.in-global-loading {
  position: fixed;
  inset: 0;
  z-index: var(--in-z-dropdown);
  background: var(--in-bg-color-canvas);

  & .in-global-loading-box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  & .in-global-loading-mark {
    display: block;
    width: 96px;
    height: 96px;
  }

  & .in-global-loading-text {
    color: var(--in-color-primary);
    font-size: 14px;
    text-align: center;
    margin-top: 5px;
  }

  & .in-global-loading-dots > span {
    opacity: 0;
    animation: in-global-loading-dot 1.8s ease-in-out infinite;
  }

  & .in-global-loading-dots > span:nth-child(2) {
    animation-delay: 0.25s;
  }

  & .in-global-loading-dots > span:nth-child(3) {
    animation-delay: 0.5s;
  }
}

@keyframes in-global-loading-dot {
  0%,
  12% {
    opacity: 0;
  }
  22%,
  72% {
    opacity: 1;
  }
  88%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .in-global-loading .in-global-loading-dots > span {
    animation: none;
    opacity: 1;
  }
}
</style>
