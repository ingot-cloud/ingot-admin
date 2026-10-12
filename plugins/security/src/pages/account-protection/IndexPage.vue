<template>
  <in-page-frame mode="page" surface="workspace" class="security-settings">
    <template #header>
      <in-page-header description="分别维护管理员与会员的登录失败锁定策略。" />
    </template>
    <template #tabs>
      <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
    </template>

    <in-form-content class="account-protection-page">
      <LockoutPolicyPanel
        v-if="
          allowed(AccountProtectionTabEnum.ADMIN_LOCKOUT) &&
          visitedTabs[AccountProtectionTabEnum.ADMIN_LOCKOUT]
        "
        v-show="activeTab === AccountProtectionTabEnum.ADMIN_LOCKOUT"
        :user-type="SessionUserTypeEnum.ADMIN"
        :tab="AccountProtectionTabEnum.ADMIN_LOCKOUT"
      />
      <LockoutPolicyPanel
        v-if="
          allowed(AccountProtectionTabEnum.APP_LOCKOUT) &&
          visitedTabs[AccountProtectionTabEnum.APP_LOCKOUT]
        "
        v-show="activeTab === AccountProtectionTabEnum.APP_LOCKOUT"
        :user-type="SessionUserTypeEnum.APP"
        :tab="AccountProtectionTabEnum.APP_LOCKOUT"
      />
    </in-form-content>
  </in-page-frame>
</template>

<script setup lang="ts">
import { useSecurityTabs, SecurityAction } from "@/hooks/useSecurityTabs";
import {
  AccountProtectionTabEnum,
  SessionUserTypeEnum,
  useAccountProtectionTabEnum,
} from "@/models/enums";
import LockoutPolicyPanel from "./components/LockoutPolicyPanel.vue";

const accountProtectionTabEnum = useAccountProtectionTabEnum();
const tabOptions = accountProtectionTabEnum.getOptions();
const { activeTab, visitedTabs, tabs, allowed } = useSecurityTabs(tabOptions, {
  [AccountProtectionTabEnum.ADMIN_LOCKOUT]: SecurityAction.LOCKOUT_READ,
  [AccountProtectionTabEnum.APP_LOCKOUT]: SecurityAction.LOCKOUT_READ,
});
</script>
