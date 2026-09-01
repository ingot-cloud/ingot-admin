<template>
  <div
    :class="isFullscreen ? 'i-mdi-fullscreen-exit' : 'i-mdi-fullscreen'"
    cursor-pointer
    @click="useFullscreenFn.toggle()"
  ></div>
</template>
<script lang="ts" setup>
const useFullscreenFn = useFullscreen();
const isFullscreen = useFullscreenFn.isFullscreen;
</script>
