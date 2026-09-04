<template>
  <el-config-provider :button="buttonConfig" :size="componentSize" :locale="zhCn">
    <router-view />
    <ChallengeHost />
    <component :is="queryDevtools" v-if="queryDevtools" />
  </el-config-provider>
</template>
<script lang="ts" setup>
import { useAppStateStore } from "@/stores/modules/app";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import ChallengeHost from "@/components/challenge/ChallengeHost.vue";
import type { Component } from "vue";

const { componentSize } = storeToRefs(useAppStateStore());
const buttonConfig = reactive({
  autoInsertSpace: false,
});
const queryDevtools = shallowRef<Component>();

if (import.meta.env.DEV) {
  void import("@tanstack/vue-query-devtools").then((module) => {
    queryDevtools.value = module.VueQueryDevtools;
  });
}

useInWebTitle();
</script>
