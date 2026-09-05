<template>
  <button
    type="button"
    class="in-icon-button"
    :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
    @click="useFullscreenFn.toggle()"
  >
    <div
      :class="isFullscreen ? 'i-mdi-fullscreen-exit' : 'i-mdi-fullscreen'"
      class="in-fullscreen-icon"
    ></div>
  </button>
</template>
<script lang="ts" setup>
const useFullscreenFn = useFullscreen();
const isFullscreen = useFullscreenFn.isFullscreen;
</script>
<style scoped lang="postcss">
.in-fullscreen-icon {
  width: var(--in-app-bar-icon-size);
  height: var(--in-app-bar-icon-size);
}
</style>
