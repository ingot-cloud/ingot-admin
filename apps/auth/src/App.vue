<template>
  <el-config-provider :button="buttonConfig" :size="componentSize" :locale="zhCn">
    <router-view />
    <ChallengeHost />
  </el-config-provider>
</template>
<script lang="ts" setup>
import zhCn from "element-plus/es/locale/lang/zh-cn";
import ChallengeHost from "@/components/challenge/ChallengeHost.vue";

const componentSize = "default" as const;
const buttonConfig = reactive({
  autoInsertSpace: false,
});
</script>
