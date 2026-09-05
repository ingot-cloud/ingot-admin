<template>
  <div
    class="in-page-frame"
    :class="[`is-${mode}`, `is-${surface}`]"
    data-testid="in-page-frame"
  >
    <div v-if="slots.header" class="in-page-frame__header">
      <slot name="header" />
    </div>
    <div v-if="slots.tabs" class="in-page-frame__tabs">
      <slot name="tabs" />
    </div>
    <div
      ref="bodyRef"
      class="in-page-frame__body"
      :class="{
        'is-page': mode === 'page',
        'is-contained': mode === 'contained',
        'is-scrollable': mode === 'page',
      }"
    >
      <slot />
      <el-backtop v-if="mode === 'page' && showBacktop" :target="backtopTarget" :right="60" :bottom="60">
        <div flex items-center justify-center>
          <i-material-symbols:vertical-align-top-rounded />
        </div>
      </el-backtop>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { InPageScrollMode, InPageSurface } from "./types";
import { useContentScroll } from "@/layouts/main/useContentScroll";

defineOptions({
  name: "InPageFrame",
});

withDefaults(
  defineProps<{
    mode?: InPageScrollMode;
    surface?: InPageSurface;
    showBacktop?: boolean;
  }>(),
  {
    mode: "page",
    surface: "plain",
    showBacktop: true,
  },
);

const slots = defineSlots<{
  header?: () => unknown;
  tabs?: () => unknown;
  default?: () => unknown;
}>();

const bodyRef = ref<HTMLElement>();
useContentScroll(bodyRef);

const backtopTarget = ".in-page-frame__body.is-page";
</script>
<style lang="postcss" scoped>
.in-page-frame {
  @apply flex flex-col min-w-0 w-full;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.in-page-frame.is-workspace {
  background: var(--in-bg-color-surface);
}

.in-page-frame.is-plain {
  background: transparent;
}

.in-page-frame__header,
.in-page-frame__tabs {
  flex: none;
  min-width: 0;
}

.in-page-frame__body {
  @apply flex flex-col min-w-0;
  flex: 1;
  min-height: 0;
}

.in-page-frame__body.is-page {
  overflow: auto;
  padding-bottom: var(--in-page-gutter);
  box-sizing: border-box;
}

.in-page-frame__body.is-contained {
  overflow: hidden;
}

.in-page-frame__body.is-contained > :deep(*) {
  flex: 1;
  min-height: 0;
  max-height: 100%;
}
</style>
