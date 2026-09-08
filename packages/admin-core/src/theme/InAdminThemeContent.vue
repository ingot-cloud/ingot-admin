<template>
  <el-main :ref="setContentRef" class="in-content-viewport">
    <div class="in-content-viewport__host">
      <router-view v-slot="{ Component }">
        <keep-alive :include="cacheNames">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </el-main>
</template>
<script lang="ts" setup>
import { useRouterStore } from "@/stores/modules/router";
import { useContentScroll } from "@/layouts/main/useContentScroll";

defineOptions({
  name: "InAdminThemeContent",
});

const { cacheNames } = storeToRefs(useRouterStore());
const contentRef = ref<HTMLElement>();
const setContentRef = (el: unknown) => {
  if (el && typeof el === "object" && "$el" in el) {
    contentRef.value = (el as { $el: HTMLElement }).$el;
    return;
  }
  contentRef.value = el instanceof HTMLElement ? el : undefined;
};
useContentScroll(contentRef);
</script>
<style lang="postcss" scoped>
.in-content-viewport {
  @apply bg-[var(--in-bg-color-canvas)] box-border min-w-0 flex flex-col;
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.in-content-viewport__host {
  @apply flex flex-col min-w-0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--in-page-gutter);
}

.in-content-viewport__host > :deep(*) {
  flex: 1;
  min-height: 0;
  max-height: 100%;
}

.in-content-viewport__host > :deep(:not(.in-page-frame):not(.in-split-layout)) {
  overflow: auto;
  padding-bottom: var(--in-page-gutter);
  box-sizing: border-box;
}
</style>
