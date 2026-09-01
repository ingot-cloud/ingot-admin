<template>
  <in-filter-container>
    <template #header>
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
  </in-filter-container>
</template>
<script lang="ts" setup>
import { CredentialPolicyTypeEnum, useCredentialPolicyTypeEnum } from "@base/models/enums";
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
:deep(.in-filter-container-header) {
  padding: 0 !important;
}

.credential-policy-page {
  padding: 8px 12px 16px;
}
</style>
