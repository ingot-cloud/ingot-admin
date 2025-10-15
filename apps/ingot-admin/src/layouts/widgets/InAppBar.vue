<template>
  <div flex justify-center items-center p-l-12px>
    <in-logo />
    <in-app-bar-search m-l-60px v-if="appStateStore.getShowSearch" />
  </div>

  <div flex justify-center items-center gap-4 p-r-12px>
    <in-fullscreen />
    <in-global-setting />

    <span class="h-[var(--in-app-bar-icon-size)] w-1px bg-[hsla(0,0%,100%,.16)]"></span>

    <in-user-dropdown />
  </div>
</template>
<script setup lang="ts">
import { useAppStateStore } from "@/stores/modules/app";

const appStateStore = useAppStateStore();
</script>
