<template>
  <in-page-frame mode="contained" surface="workspace" class="security-settings">
    <template #header>
      <in-page-header description="查询在线会话并配置并发策略。" />
    </template>
    <template #tabs>
      <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
    </template>

    <div class="online-token-page security-settings__tables">
      <SessionListPanel
        v-if="allowed(OnlineTokenTabEnum.SESSION) && visitedTabs[OnlineTokenTabEnum.SESSION]"
        v-show="activeTab === OnlineTokenTabEnum.SESSION"
      />
      <ConcurrencyPolicyPanel
        v-if="allowed(OnlineTokenTabEnum.POLICY) && visitedTabs[OnlineTokenTabEnum.POLICY]"
        v-show="activeTab === OnlineTokenTabEnum.POLICY"
      />
    </div>
  </in-page-frame>
</template>

<script setup lang="ts">
import { useSecurityTabs, SecurityAction } from "@/hooks/useSecurityTabs";
import { OnlineTokenTabEnum, useOnlineTokenTabEnum } from "@/models/enums";
import SessionListPanel from "./components/SessionListPanel.vue";
import ConcurrencyPolicyPanel from "./components/ConcurrencyPolicyPanel.vue";

const onlineTokenTabEnum = useOnlineTokenTabEnum();
const tabOptions = onlineTokenTabEnum.getOptions();
const { activeTab, visitedTabs, tabs, allowed } = useSecurityTabs(tabOptions, {
  [OnlineTokenTabEnum.SESSION]: SecurityAction.SESSION_READ,
  [OnlineTokenTabEnum.POLICY]: SecurityAction.CONCURRENCY_READ,
});
</script>

<style lang="postcss" scoped>
.online-token-page {
  @apply min-h-0;
}
</style>
