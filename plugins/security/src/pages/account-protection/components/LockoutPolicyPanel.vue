<template>
  <in-loading :loading="loading" class="lockout-panel">
    <div class="lockout-panel__tip">
      保存后策略将在数秒内生效。已处于锁定中的账号不会因策略变更自动解锁。
    </div>
    <LockoutPolicyColumn
      :title="title"
      :user-type="userType"
      :config="config"
      :saving="saving"
      :save-policy="savePolicy"
    />
  </in-loading>
</template>

<script setup lang="ts">
import { AccountProtectionTabEnum, SessionUserTypeEnum } from "@/models/enums";
import LockoutPolicyColumn from "./LockoutPolicyColumn.vue";
import { useLockoutPolicy } from "../use/useLockoutPolicy";

defineOptions({
  name: "LockoutPolicyPanel",
});

const props = defineProps<{
  userType: SessionUserTypeEnum;
  tab: AccountProtectionTabEnum;
}>();
const title = computed(() =>
  props.userType === SessionUserTypeEnum.ADMIN ? "B 端（管理员）" : "C 端（会员）",
);
const { loading, saving, config, savePolicy } = useLockoutPolicy(props.userType, props.tab);
</script>

<style lang="postcss" scoped>
.lockout-panel {
  @apply min-h-0;

  & .lockout-panel__tip {
    @apply mb-16px text-13px text-[var(--in-text-color-secondary)];
  }
}
</style>
