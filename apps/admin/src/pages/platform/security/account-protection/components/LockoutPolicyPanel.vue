<template>
  <div v-loading="loading" class="lockout-panel">
    <div class="lockout-panel__tip">
      保存后策略将在数秒内生效。已处于锁定中的账号不会因策略变更自动解锁。
    </div>
    <el-row :gutter="16">
      <el-col :xs="24" :lg="12" class="lockout-panel__col">
        <LockoutPolicyColumn
          title="B 端（管理员）"
          :user-type="SessionUserTypeEnum.ADMIN"
          :config="policyMap[SessionUserTypeEnum.ADMIN]"
          :saving="saving"
          :save-policy="savePolicy"
          @saved="loadAll"
        />
      </el-col>
      <el-col :xs="24" :lg="12" class="lockout-panel__col">
        <LockoutPolicyColumn
          title="C 端（会员）"
          :user-type="SessionUserTypeEnum.APP"
          :config="policyMap[SessionUserTypeEnum.APP]"
          :saving="saving"
          :save-policy="savePolicy"
          @saved="loadAll"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { SessionUserTypeEnum } from "@base/models/enums";
import LockoutPolicyColumn from "./LockoutPolicyColumn.vue";
import { useLockoutPolicy } from "../use/useLockoutPolicy";

defineOptions({
  name: "LockoutPolicyPanel",
});

const { loading, saving, policyMap, loadAll, savePolicy } = useLockoutPolicy();

onMounted(() => {
  loadAll();
});
</script>

<style lang="postcss" scoped>
.lockout-panel {
  @apply min-h-0;

  & .lockout-panel__tip {
    @apply mb-16px text-13px text-[var(--in-text-color-secondary)];
  }

  & .lockout-panel__col {
    @apply mb-16px;
  }
}
</style>
