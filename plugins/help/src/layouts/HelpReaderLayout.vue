<template>
  <div class="help-reader">
    <header class="help-header">
      <RouterLink class="help-brand" to="/help">
        <img v-if="branding.logo" :src="branding.logo" alt="" />
        <span v-else class="help-brand-mark" aria-hidden="true">i</span>
        <span>帮助中心</span>
        <span class="help-domain-badge">{{
          runtime.entry === "tenant" ? "租户端" : "平台端"
        }}</span>
      </RouterLink>
      <BizHelpSearch v-if="route.name !== 'help.home'" class="help-header-search" />
      <button type="button" class="help-back-button" @click="runtime.back()">
        <InIcon name="ep:arrow-left" />返回管理台
      </button>
    </header>
    <div class="help-body" :class="{ 'is-home': route.name === 'help.home' }">
      <aside
        v-if="route.name !== 'help.home' && catalog"
        v-show="!sidebarCollapsed"
        class="help-sidebar"
      >
        <BizHelpCategoryTree />
      </aside>
      <button
        v-if="route.name !== 'help.home' && catalog"
        type="button"
        class="help-sidebar-toggle"
        :class="{ 'is-collapsed': sidebarCollapsed }"
        :aria-label="sidebarCollapsed ? '展开帮助目录' : '收起帮助目录'"
        :aria-expanded="!sidebarCollapsed"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <in-icon :name="sidebarCollapsed ? 'ep:arrow-right' : 'ep:arrow-left'" />
      </button>
      <button
        v-if="route.name !== 'help.home' && catalog"
        type="button"
        class="help-mobile-directory"
        @click="directoryOpen = true"
      >
        <InIcon name="ep:menu" />浏览目录
      </button>
      <main class="help-scroll" data-help-scroll>
        <BizHelpState
          v-if="loading || error"
          :loading="loading"
          :message="error"
          @retry="privateLoad"
        />
        <RouterView v-else-if="catalog" :key="`${runtime.scope()}:${catalog.contentVersion}`" />
      </main>
    </div>
    <el-drawer
      v-model="directoryOpen"
      title="帮助目录"
      direction="ltr"
      size="min(320px, 90vw)"
      append-to-body
    >
      <BizHelpCategoryTree />
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { getAdminRuntimeConfig } from "@ingot/admin-core";
import { useHelpRuntime } from "../runtime";
import BizHelpSearch from "../components/BizHelpSearch.vue";
import BizHelpState from "../components/BizHelpState.vue";
import BizHelpCategoryTree from "../components/BizHelpCategoryTree.vue";
const runtime = useHelpRuntime(),
  route = useRoute();
const catalog = runtime.catalog;
const branding = computed(() => getAdminRuntimeConfig().branding);
const loading = ref(true),
  error = ref<string>(),
  directoryOpen = ref(false);
const sidebarCollapsed = ref(false);
let ticket = 0;
const privateLoad = async (): Promise<void> => {
  const current = ++ticket;
  loading.value = true;
  error.value = undefined;
  try {
    await runtime.loadCatalog();
  } catch (failure) {
    if (current === ticket && !(failure instanceof DOMException && failure.name === "AbortError"))
      error.value = failure instanceof Error ? failure.message : "帮助内容暂不可用";
  } finally {
    if (current === ticket) loading.value = false;
  }
};
watch(runtime.scope, privateLoad, { immediate: true });
watch(
  () => route.fullPath,
  () => {
    directoryOpen.value = false;
  },
);
</script>
