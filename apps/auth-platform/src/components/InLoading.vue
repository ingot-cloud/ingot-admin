<template>
  <div class="in-loading">
    <slot />
    <div
      v-if="loading"
      class="in-loading__cover"
      role="status"
      aria-live="polite"
      aria-label="加载中"
    >
      <img
        class="in-loading-mark"
        :src="loadingSrc"
        alt=""
        width="64"
        height="64"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
import loadingDark from "@/assets/loading/in-loading-dark.svg";
import loadingLight from "@/assets/loading/in-loading-light.svg";

defineOptions({
  name: "InLoading",
});

withDefaults(
  defineProps<{
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const isDark = ref(document.documentElement.classList.contains("dark"));
const loadingSrc = computed(() => (isDark.value ? loadingDark : loadingLight));

let themeObserver: MutationObserver | undefined;
onMounted(() => {
  const root = document.documentElement;
  const syncTheme = () => {
    isDark.value = root.classList.contains("dark");
  };
  syncTheme();
  themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
});
onUnmounted(() => {
  themeObserver?.disconnect();
});
</script>
<style lang="postcss" scoped>
.in-loading {
  position: relative;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.in-loading > :not(.in-loading__cover) {
  flex: 1 1 auto;
  min-width: 0;
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

.in-loading-mark {
  display: block;
}
</style>
