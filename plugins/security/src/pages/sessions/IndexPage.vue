<template>
  <in-page-frame mode="page">
    <template #header>
      <in-page-header>
        <template #tabs>
          <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
        </template>
      </in-page-header>
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
  </in-page-frame>
</template>

<script setup lang="ts">
import { OnlineTokenTabEnum, useOnlineTokenTabEnum } from "@/models/enums";
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
.online-token-page {
  @apply min-h-0;
}
</style>
