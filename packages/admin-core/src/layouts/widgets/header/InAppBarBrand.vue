<template>
  <div
    class="in-app-bar__brand"
    :class="{
      'is-collapsed': navigationMode === 'collapsed',
      'is-overlay': navigationMode === 'overlay',
      'is-compact': compact,
      'is-placeholder': !visible,
    }"
    data-testid="app-bar-brand"
  >
    <template v-if="visible">
      <el-tooltip
        v-if="navigationMode === 'overlay'"
        :content="overlayOpen ? '关闭导航' : '打开导航'"
        effect="light"
        placement="bottom"
      >
        <button
          type="button"
          class="in-icon-button"
          :aria-label="overlayOpen ? '关闭导航' : '打开导航'"
          @click="privateOnToggle"
        >
          <in-icon name="ep:expand" class="in-app-bar__icon" />
        </button>
      </el-tooltip>
      <component
        :is="brandComponent"
        v-if="brandComponent"
        :navigation-mode="navigationMode"
        :compact="compact"
      />
      <in-logo v-else :show-title="showTitle" />
      <div v-if="slots['brand-extra']" class="in-app-bar__brand-extra">
        <slot name="brand-extra" />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import type { Component } from "vue";
import type { InNavigationMode } from "@/components/types";

defineOptions({
  name: "InAppBarBrand",
});

const props = defineProps<{
  visible: boolean;
  brandComponent?: Component;
  navigationMode: InNavigationMode;
  overlayOpen: boolean;
  compact: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const slots = defineSlots<{
  "brand-extra"?: () => unknown;
}>();

const showTitle = computed(
  () => props.navigationMode === "expanded" && props.visible && !props.compact,
);

const privateOnToggle = () => {
  emit("toggle");
};
</script>
<style lang="postcss" scoped>
.in-app-bar__brand {
  @apply flex items-center min-w-0 box-border;
  flex: none;
  height: 100%;
  overflow: hidden;
  gap: var(--in-space-2);
  width: calc(
    var(--in-sidebar-gutter) + var(--in-sidebar-panel-expanded) - var(--in-app-bar-padding-inline)
  );
  transition: width var(--in-motion-duration-sidebar) var(--in-motion-ease-sidebar);
}

.in-app-bar__brand.is-collapsed {
  width: calc(
    var(--in-sidebar-gutter) + var(--in-sidebar-panel-collapsed) - var(--in-app-bar-padding-inline)
  );
}

.in-app-bar__brand.is-overlay,
.in-app-bar__brand.is-compact {
  width: auto;
  min-width: var(--in-icon-button-size);
}

.in-app-bar__brand-extra {
  @apply flex items-center min-w-0;
}

@media (prefers-reduced-motion: reduce) {
  .in-app-bar__brand {
    transition: none;
  }
}
</style>
