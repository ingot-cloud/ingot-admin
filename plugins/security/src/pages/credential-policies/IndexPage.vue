<template>
  <in-page-frame mode="page" surface="workspace" class="security-settings">
    <template #header>
      <in-page-header description="按类型维护凭证策略，各分组独立保存。" />
    </template>
    <template #tabs>
      <in-biz-tabs-header v-model="activeTab" :tabs="tabs" />
    </template>

    <in-form-content class="credential-policy-page">
      <in-loading :loading="loading">
        <template v-if="canRead">
          <template v-for="item in tabOptions" :key="item.value">
            <PolicyTabPanel
              v-if="visitedTabs[item.value]"
              v-show="activeTab === item.value"
              :policy-type="item.value"
              :config="policyMap[item.value]"
              :save-policy="savePolicy"
            />
          </template>
        </template>
      </in-loading>
    </in-form-content>
  </in-page-frame>
</template>
<script lang="ts" setup>
import { useActiveSecurityRead, SecurityAction } from "@/hooks/useSecurityTabs";
import { CredentialPolicyTypeEnum, useCredentialPolicyTypeEnum } from "@/models/enums";
import PolicyTabPanel from "./components/PolicyTabPanel.vue";
import { useCredentialPolicy } from "./useCredentialPolicy";

const canRead = useActiveSecurityRead(SecurityAction.CREDENTIAL_READ);
const credentialPolicyTypeEnum = useCredentialPolicyTypeEnum();
const tabOptions = credentialPolicyTypeEnum.getOptions();
const activeTab = ref(CredentialPolicyTypeEnum.STRENGTH);

const visitedTabs = reactive<Record<string, boolean>>({});
watch(
  activeTab,
  (tab) => {
    visitedTabs[tab] = true;
  },
  { immediate: true },
);

const tabs = computed(() =>
  tabOptions.map((item) => ({
    id: item.value,
    title: item.label,
  })),
);

const { loading, policyMap, savePolicy } = useCredentialPolicy();
</script>
