<template>
  <button
    type="button"
    class="in-icon-button"
    :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
    @click="useFullscreenFn.toggle()"
  >
    <div
      :class="isFullscreen ? 'i-mdi-fullscreen-exit' : 'i-mdi-fullscreen'"
      class="in-app-bar__icon"
    ></div>
  </button>
</template>
<script lang="ts" setup>
const useFullscreenFn = useFullscreen();
const isFullscreen = useFullscreenFn.isFullscreen;
</script>
