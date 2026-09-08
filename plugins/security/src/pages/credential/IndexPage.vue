<template>
  <in-page-frame mode="page" surface="workspace">
    <template #header>
      <in-page-header description="按类型维护凭证策略，各分组独立保存。" />
    </template>
    <template #tabs>
      <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
    </template>

    <div v-loading="loading" class="credential-policy-page">
      <PolicyTabPanel
        v-for="item in tabOptions"
        v-show="activeTab === item.value"
        :key="item.value"
        :policy-type="item.value"
        :config="policyMap[item.value]"
        :save-policy="savePolicy"
        @saved="loadAll"
      />
    </div>
  </in-page-frame>
</template>
<script lang="ts" setup>
import { CredentialPolicyTypeEnum, useCredentialPolicyTypeEnum } from "@/models/enums";
import PolicyTabPanel from "./components/PolicyTabPanel.vue";
import { useCredentialPolicy } from "./useCredentialPolicy";

const credentialPolicyTypeEnum = useCredentialPolicyTypeEnum();
const tabOptions = credentialPolicyTypeEnum.getOptions();
const activeTab = ref(CredentialPolicyTypeEnum.STRENGTH);

const tabs = computed(() =>
  tabOptions.map((item) => ({
    id: item.value,
    title: item.label,
  })),
);

const { loading, policyMap, loadAll, savePolicy } = useCredentialPolicy();

onMounted(() => {
  loadAll();
});
</script>
<style lang="postcss" scoped>
.credential-policy-page {
  @apply min-h-0;
  padding: var(--in-space-5);
}
</style>
