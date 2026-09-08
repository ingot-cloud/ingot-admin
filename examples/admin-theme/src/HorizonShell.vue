<template>
  <div class="ex-horizon">
    <header v-if="$slots.header" class="ex-horizon__header">
      <slot name="header" />
    </header>
    <div class="ex-horizon__workspace">
      <div
        v-if="isOverlay && overlayOpen"
        class="ex-horizon__mask"
        aria-hidden="true"
        @click="closeOverlay"
      />
      <div
        class="ex-horizon__main"
        :class="{
          'has-breadcrumb': Boolean($slots.breadcrumb),
          'has-copyright': Boolean($slots.footer),
        }"
      >
        <div v-if="$slots.breadcrumb" class="ex-horizon__breadcrumb">
          <slot name="breadcrumb" />
        </div>
        <div class="ex-horizon__content">
          <slot name="content" />
        </div>
        <slot name="footer" />
      </div>
      <aside v-if="$slots.navigation" class="ex-horizon__nav" :class="navClass">
        <slot name="navigation" />
      </aside>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useAdminShell } from "@ingot/admin-core";

defineOptions({
  name: "HorizonShell",
});

const { isOverlay, overlayOpen, navigationMode, closeOverlay } = useAdminShell();

const navClass = computed(() => ({
  "is-overlay": isOverlay.value,
  "is-overlay-open": isOverlay.value && overlayOpen.value,
  "is-collapsed": navigationMode.value === "collapsed",
}));
</script>
<style scoped>
.ex-horizon {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--in-bg-color-canvas);
}

.ex-horizon__header {
  flex: none;
  z-index: var(--in-z-header);
  background: var(--in-app-bar-bg);
  border-bottom: 2px solid var(--ex-accent, var(--in-color-primary));
}

.ex-horizon__workspace {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.ex-horizon__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.ex-horizon__breadcrumb {
  flex: none;
  height: var(--in-page-breadcrumb-height);
  padding: 0 var(--in-page-gutter);
}

.ex-horizon__content {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.ex-horizon__nav {
  flex: none;
  width: calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-expanded));
  padding-right: var(--in-sidebar-gutter);
  background: var(--in-bg-color-sidebar);
  overflow: hidden;
  z-index: var(--in-z-sidebar);
  transition:
    width var(--in-motion-duration-sidebar) var(--in-motion-ease-sidebar),
    transform var(--in-motion-duration-sidebar) var(--in-motion-ease-sidebar);
}

.ex-horizon__nav.is-collapsed {
  width: calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-collapsed));
}

.ex-horizon__nav.is-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: var(--in-z-overlay-sidebar);
  transform: translateX(100%);
  width: calc(var(--in-sidebar-gutter) + var(--in-sidebar-panel-expanded));
  box-shadow: var(--in-shadow-overlay);
}

.ex-horizon__nav.is-overlay-open {
  transform: translateX(0);
}

.ex-horizon__mask {
  position: absolute;
  inset: 0;
  z-index: var(--in-z-overlay-mask);
  background: var(--in-overlay-mask);
}
</style>
