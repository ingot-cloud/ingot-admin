<template>
  <Teleport to="body" :disabled="overlay !== 'fullscreen'">
    <div
      v-if="overlay !== 'none'"
      class="in-loading-mark-overlay"
      :class="overlay === 'fullscreen' ? 'is-fullscreen' : 'is-local'"
      role="status"
      aria-live="polite"
      :aria-label="hint"
    >
      <div v-if="showFrame" class="in-loading-mark-card">
        <img
          class="in-loading-mark"
          :src="loadingSrc"
          alt=""
          :width="size"
          :height="size"
          aria-hidden="true"
        />
      </div>
      <img
        v-else
        class="in-loading-mark"
        :src="loadingSrc"
        alt=""
        :width="size"
        :height="size"
        aria-hidden="true"
      />
    </div>
    <div v-else-if="showFrame" class="in-loading-mark-card">
      <img
        class="in-loading-mark"
        :src="loadingSrc"
        alt=""
        :width="size"
        :height="size"
        aria-hidden="true"
      />
    </div>
    <img
      v-else
      class="in-loading-mark"
      :src="loadingSrc"
      alt=""
      :width="size"
      :height="size"
      aria-hidden="true"
    />
  </Teleport>
</template>
<script lang="ts" setup>
import { useAdminTheme } from "@/theme/useAdminTheme";
import loadingDark from "../assets/loading/in-loading-dark.svg";
import loadingLight from "../assets/loading/in-loading-light.svg";
import type { InLoadingOverlay } from "./types";

defineOptions({
  name: "InLoadingMark",
});

const props = withDefaults(
  defineProps<{
    size?: number;
    /** 圆角底 + 阴影，用来和后面的页面分开。搜索等内嵌场景可关掉。 */
    framed?: boolean;
    /** 不罩、罩住当前区域，或全屏遮罩。 */
    overlay?: InLoadingOverlay;
    hint?: string;
  }>(),
  {
    size: 64,
    framed: true,
    overlay: "none",
    hint: "加载中",
  },
);

const { isDark } = useAdminTheme();
const loadingSrc = computed(() => (isDark.value ? loadingDark : loadingLight));
const showFrame = computed(() => props.framed);
</script>
<style lang="postcss" scoped>
.in-loading-mark {
  display: block;
}

.in-loading-mark-card {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--in-space-4);
  border-radius: var(--in-radius-card-lg);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-md);
}

.in-loading-mark-overlay {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.in-loading-mark-overlay.is-local {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--in-gray-950) 6%, transparent);
}

.in-loading-mark-overlay.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: var(--in-z-dropdown);
  background: var(--in-overlay-mask);
}
</style>
