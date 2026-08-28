<template>
  <in-filter-container>
    <template #header>
      <div class="access-protection-header">
        <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
        <in-button
          :loading="broadcasting"
          @click="privateOnBroadcastClick"
        >
          强制刷新策略
        </in-button>
      </div>
    </template>

    <div class="access-protection-page">
      <EndpointGroupPanel
        v-if="visitedTabs[AccessProtectionTabEnum.ENDPOINT_GROUP]"
        v-show="activeTab === AccessProtectionTabEnum.ENDPOINT_GROUP"
      />
      <RateLimitRulePanel
        v-if="visitedTabs[AccessProtectionTabEnum.RATE_LIMIT]"
        v-show="activeTab === AccessProtectionTabEnum.RATE_LIMIT"
      />
      <IpListPanel
        v-if="visitedTabs[AccessProtectionTabEnum.IP_LIST]"
        v-show="activeTab === AccessProtectionTabEnum.IP_LIST"
      />
      <ViolationEscalationPanel
        v-if="visitedTabs[AccessProtectionTabEnum.VIOLATION_ESCALATION]"
        v-show="activeTab === AccessProtectionTabEnum.VIOLATION_ESCALATION"
      />
      <LoginFailurePanel
        v-if="visitedTabs[AccessProtectionTabEnum.LOGIN_FAILURE]"
        v-show="activeTab === AccessProtectionTabEnum.LOGIN_FAILURE"
      />
      <ChallengePolicyPanel
        v-if="visitedTabs[AccessProtectionTabEnum.CHALLENGE]"
        v-show="activeTab === AccessProtectionTabEnum.CHALLENGE"
      />
      <BlockEventPanel
        v-if="visitedTabs[AccessProtectionTabEnum.BLOCK_EVENT]"
        v-show="activeTab === AccessProtectionTabEnum.BLOCK_EVENT"
      />
    </div>
  </in-filter-container>
</template>

<script setup lang="ts">
import { AccessProtectionTabEnum, useAccessProtectionTabEnum } from "@/models/enums";
import { useGatewayPolicy } from "./use/useGatewayPolicy";
import EndpointGroupPanel from "./components/EndpointGroupPanel.vue";
import RateLimitRulePanel from "./components/RateLimitRulePanel.vue";
import IpListPanel from "./components/IpListPanel.vue";
import ViolationEscalationPanel from "./components/ViolationEscalationPanel.vue";
import LoginFailurePanel from "./components/LoginFailurePanel.vue";
import ChallengePolicyPanel from "./components/ChallengePolicyPanel.vue";
import BlockEventPanel from "./components/BlockEventPanel.vue";

const accessProtectionTabEnum = useAccessProtectionTabEnum();
const tabOptions = accessProtectionTabEnum.getOptions();
const activeTab = ref(AccessProtectionTabEnum.ENDPOINT_GROUP);
const visitedTabs = reactive<Partial<Record<string, boolean>>>({
  [AccessProtectionTabEnum.ENDPOINT_GROUP]: true,
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

const { broadcasting, broadcastInvalidation } = useGatewayPolicy();

const privateOnBroadcastClick = async (): Promise<void> => {
  await broadcastInvalidation();
};
</script>

<style lang="postcss" scoped>
:deep(.in-filter-container-header) {
  padding: 0 !important;
}

.access-protection-header {
  @apply flex flex-row items-center justify-between gap-3 pr-12px;
}

.access-protection-page {
  @apply min-h-0;
}
</style>
