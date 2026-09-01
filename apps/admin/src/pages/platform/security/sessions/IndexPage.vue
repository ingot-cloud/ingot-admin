<template>
  <in-filter-container>
    <template #header>
      <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
    </template>

    <div class="online-token-page">
      <SessionListPanel
        v-if="visitedTabs[OnlineTokenTabEnum.SESSION]"
        v-show="activeTab === OnlineTokenTabEnum.SESSION"
      />
      <ConcurrencyPolicyPanel
        v-if="visitedTabs[OnlineTokenTabEnum.POLICY]"
        v-show="activeTab === OnlineTokenTabEnum.POLICY"
      />
    </div>
  </in-filter-container>
</template>

<script setup lang="ts">
import { OnlineTokenTabEnum, useOnlineTokenTabEnum } from "@base/models/enums";
import SessionListPanel from "./components/SessionListPanel.vue";
import ConcurrencyPolicyPanel from "./components/ConcurrencyPolicyPanel.vue";

const onlineTokenTabEnum = useOnlineTokenTabEnum();
const tabOptions = onlineTokenTabEnum.getOptions();
const activeTab = ref(OnlineTokenTabEnum.SESSION);
const visitedTabs = reactive<Partial<Record<string, boolean>>>({
  [OnlineTokenTabEnum.SESSION]: true,
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

.online-token-page {
  @apply min-h-0;
}
</style>
