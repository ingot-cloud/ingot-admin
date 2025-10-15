<template>
  <div flex justify-center items-center box-border class="in-logo">
    <img class="logo-image" src="@/assets/logo-white.png" />
    <span class="title">
      {{ app.title }}
    </span>
  </div>
</template>
<script setup lang="ts">
import { useAppStore } from "@/stores/modules/app";
const { app } = useAppStore();
</script>
<style scoped lang="postcss">
.in-logo {
  @apply h-[var(--in-app-bar-height)];

  & .logo-image {
    height: 28px;
    width: 28px;
    margin-bottom: 5px;
  }

  & .title {
    @apply m-l-2 truncate;
    color: white;
    font-size: 18px;
  }
}
</style>
