<template>
  <in-page-frame mode="page">
    <template #header>
      <in-page-header description="分别维护管理员与会员的登录失败锁定策略。">
        <template #tabs>
          <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
        </template>
      </in-page-header>
    </template>

    <div class="account-protection-page">
      <LockoutPolicyPanel
        v-if="visitedTabs[AccountProtectionTabEnum.LOCKOUT]"
        v-show="activeTab === AccountProtectionTabEnum.LOCKOUT"
      />
    </div>
  </in-page-frame>
</template>

<script setup lang="ts">
import { AccountProtectionTabEnum, useAccountProtectionTabEnum } from "@/models/enums";
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
.account-protection-page {
  @apply min-h-0;
  padding: var(--in-space-5);
}
</style>
