<template>
  <div flex justify-center items-center box-border class="in-logo">
    <img class="logo-image" :src="logoSrc" alt="" />
    <span class="title">
      {{ app.title }}
    </span>
  </div>
</template>
<script setup lang="ts">
import defaultLogo from "@/assets/logo.png";
import { useAppStore } from "@/stores/modules/app";
import { getAdminRuntimeConfig } from "@/runtime";

const { app } = useAppStore();
const logoSrc = computed(() => getAdminRuntimeConfig().branding.logo ?? defaultLogo);
</script>
<style scoped lang="postcss">
.in-logo {
  @apply h-[var(--in-app-bar-height)] min-w-0;

  & .logo-image {
    height: 28px;
    width: 28px;
  }

  & .title {
    @apply m-l-2 truncate;
    color: var(--in-app-bar-text);
    font-size: 16px;
    line-height: 24px;
    display: inline-block;
    word-break: keep-all;
    margin-left: 8px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 1023px) {
  .in-logo .title {
    display: none;
  }
}
</style>
