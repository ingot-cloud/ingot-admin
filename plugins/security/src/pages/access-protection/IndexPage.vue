<template>
  <in-page-frame mode="contained" surface="workspace" class="security-settings">
    <template #header>
      <in-page-header description="维护访问规则、限流与登录失败防护策略。">
        <template #action>
          <in-button
            v-auth="SecurityAction.POLICY_UPDATE"
            :loading="broadcasting"
            @click="privateOnBroadcastClick"
          >
            强制刷新策略
          </in-button>
        </template>
      </in-page-header>
    </template>
    <template #tabs>
      <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
    </template>

    <div class="access-protection-page security-settings__tables">
      <EndpointGroupPanel
        v-if="
          allowed(AccessProtectionTabEnum.ENDPOINT_GROUP) &&
          visitedTabs[AccessProtectionTabEnum.ENDPOINT_GROUP]
        "
        v-show="activeTab === AccessProtectionTabEnum.ENDPOINT_GROUP"
      />
      <RateLimitRulePanel
        v-if="
          allowed(AccessProtectionTabEnum.RATE_LIMIT) &&
          visitedTabs[AccessProtectionTabEnum.RATE_LIMIT]
        "
        v-show="activeTab === AccessProtectionTabEnum.RATE_LIMIT"
      />
      <IpListPanel
        v-if="
          allowed(AccessProtectionTabEnum.IP_LIST) && visitedTabs[AccessProtectionTabEnum.IP_LIST]
        "
        v-show="activeTab === AccessProtectionTabEnum.IP_LIST"
      />
      <ViolationEscalationPanel
        v-if="
          allowed(AccessProtectionTabEnum.VIOLATION_ESCALATION) &&
          visitedTabs[AccessProtectionTabEnum.VIOLATION_ESCALATION]
        "
        v-show="activeTab === AccessProtectionTabEnum.VIOLATION_ESCALATION"
      />
      <LoginFailurePanel
        v-if="
          allowed(AccessProtectionTabEnum.LOGIN_FAILURE) &&
          visitedTabs[AccessProtectionTabEnum.LOGIN_FAILURE]
        "
        v-show="activeTab === AccessProtectionTabEnum.LOGIN_FAILURE"
      />
      <ChallengePolicyPanel
        v-if="
          allowed(AccessProtectionTabEnum.CHALLENGE) &&
          visitedTabs[AccessProtectionTabEnum.CHALLENGE]
        "
        v-show="activeTab === AccessProtectionTabEnum.CHALLENGE"
      />
      <BlockEventPanel
        v-if="
          allowed(AccessProtectionTabEnum.BLOCK_EVENT) &&
          visitedTabs[AccessProtectionTabEnum.BLOCK_EVENT]
        "
        v-show="activeTab === AccessProtectionTabEnum.BLOCK_EVENT"
      />
    </div>
  </in-page-frame>
</template>

<script setup lang="ts">
import { useSecurityTabs, SecurityAction } from "@/hooks/useSecurityTabs";
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
const { activeTab, visitedTabs, tabs, allowed } = useSecurityTabs(tabOptions, {
  [AccessProtectionTabEnum.ENDPOINT_GROUP]: SecurityAction.POLICY_READ,
  [AccessProtectionTabEnum.RATE_LIMIT]: SecurityAction.POLICY_READ,
  [AccessProtectionTabEnum.IP_LIST]: SecurityAction.POLICY_READ,
  [AccessProtectionTabEnum.VIOLATION_ESCALATION]: SecurityAction.POLICY_READ,
  [AccessProtectionTabEnum.LOGIN_FAILURE]: SecurityAction.LOGIN_READ,
  [AccessProtectionTabEnum.CHALLENGE]: SecurityAction.POLICY_READ,
  [AccessProtectionTabEnum.BLOCK_EVENT]: SecurityAction.POLICY_READ,
});

const { broadcasting, broadcastInvalidation } = useGatewayPolicy();

const privateOnBroadcastClick = async (): Promise<void> => {
  await broadcastInvalidation();
};
</script>

<style lang="postcss" scoped>
.access-protection-page {
  @apply min-h-0;
}
</style>
