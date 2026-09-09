<template>
  <button
    type="button"
    class="in-icon-button"
    :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
    @click="useFullscreenFn.toggle()"
  >
    <in-icon
      :name="isFullscreen ? 'bi:fullscreen-exit' : 'bi:fullscreen'"
      class="in-app-bar__icon"
    />
  </button>
</template>
<script lang="ts" setup>
const useFullscreenFn = useFullscreen();
const isFullscreen = useFullscreenFn.isFullscreen;
</script>
