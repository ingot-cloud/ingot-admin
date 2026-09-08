<template>
  <div class="ex-horizon-header">
    <div class="ex-horizon-header__brand">
      <span class="ex-horizon-header__name">{{ branding.title }}</span>
      <span class="ex-horizon-header__theme">{{ themeName }}</span>
    </div>
    <div class="ex-horizon-header__start">
      <component :is="headerStart" v-if="headerStart" />
    </div>
    <div class="ex-horizon-header__end">
      <component :is="headerEnd" v-if="headerEnd" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useAdminShell, useAdminTheme } from "@ingot/admin-core";

defineOptions({
  name: "HorizonHeader",
});

const { branding, shellSlots } = useAdminShell();
const { themeName } = useAdminTheme();
const headerStart = computed(() => shellSlots.value["header-start"]);
const headerEnd = computed(() => shellSlots.value["header-end"]);
</script>
<style scoped>
.ex-horizon-header {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-width: 0;
  height: var(--in-app-bar-height);
  padding: 0 16px;
  box-sizing: border-box;
}

.ex-horizon-header__brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.ex-horizon-header__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--in-text-color);
}

.ex-horizon-header__theme {
  font-size: 12px;
  color: var(--ex-accent, var(--in-color-primary));
}

.ex-horizon-header__start,
.ex-horizon-header__end {
  display: flex;
  align-items: center;
  min-width: 0;
}

.ex-horizon-header__start {
  flex: 1;
}

.ex-horizon-header__end {
  margin-left: auto;
}
</style>
