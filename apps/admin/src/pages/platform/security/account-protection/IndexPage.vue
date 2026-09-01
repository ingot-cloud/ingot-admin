<template>
  <in-filter-container>
    <template #header>
      <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
    </template>

    <div class="account-protection-page">
      <LockoutPolicyPanel
        v-if="visitedTabs[AccountProtectionTabEnum.LOCKOUT]"
        v-show="activeTab === AccountProtectionTabEnum.LOCKOUT"
      />
    </div>
  </in-filter-container>
</template>

<script setup lang="ts">
import { AccountProtectionTabEnum, useAccountProtectionTabEnum } from "@base/models/enums";
import LockoutPolicyPanel from "./components/LockoutPolicyPanel.vue";

const accountProtectionTabEnum = useAccountProtectionTabEnum();
const tabOptions = accountProtectionTabEnum.getOptions();
const activeTab = ref(AccountProtectionTabEnum.LOCKOUT);
const visitedTabs = reactive<Partial<Record<string, boolean>>>({
  [AccountProtectionTabEnum.LOCKOUT]: true,
});

watch(activeTab, (tab) => {
  visitedTabs[tab] = true;
});

const tabs = computed(() =>
  tabOptions.map((item) => ({
    id: item.value,
    title: item.label,
  })),
);
</script>

<style lang="postcss" scoped>
:deep(.in-filter-container-header) {
  padding: 0 !important;
}

.account-protection-page {
  @apply min-h-0;
}
</style>
