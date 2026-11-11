<template>
  <Layout>
    <template #layout-bottom>
      <div />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from "vitepress/theme";

defineOptions({ name: "DevPortalLayout" });

const { Layout } = DefaultTheme;
</script>
