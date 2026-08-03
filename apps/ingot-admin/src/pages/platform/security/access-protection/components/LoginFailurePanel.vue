<template>
  <div class="login-failure-panel" v-loading="loading || saving">
    <div class="login-failure-panel__tabs">
      <in-biz-tabs-header v-model="activeDimension" :tabs="dimensionTabs" />
    </div>

    <div class="login-failure-panel__content">
      <LoginFailureDimensionPanel
        v-for="item in dimensionOptions"
        v-show="activeDimension === item.value"
        :key="item.value"
        :dimension="item.value"
        :config="policyMap[item.value]"
        :saving="saving"
        :save-policy="savePolicy"
        @saved="loadAll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LoginFailureDimensionEnum,
  LoginFailureDimensionMetaList,
} from "@/models/enums";
import { useLoginFailurePolicy } from "../use/useLoginFailurePolicy";
import LoginFailureDimensionPanel from "./LoginFailureDimensionPanel.vue";

const dimensionOptions = LoginFailureDimensionMetaList;
const activeDimension = ref(LoginFailureDimensionEnum.IP);

const dimensionTabs = computed(() =>
  dimensionOptions.map((item) => ({
    id: item.value,
    title: item.label,
  })),
);

const { loading, saving, policyMap, loadAll, savePolicy } = useLoginFailurePolicy();

onMounted(() => {
  loadAll();
});

defineExpose({
  refresh: loadAll,
});
</script>

<style lang="postcss" scoped>
.login-failure-panel {
  @apply flex flex-col min-h-0;

  & .login-failure-panel__tabs {
    @apply flex-none border-b border-[var(--in-border-color)] border-b-solid;
  }

  & .login-failure-panel__content {
    @apply flex-1 px-12px py-16px;
  }
}
</style>
