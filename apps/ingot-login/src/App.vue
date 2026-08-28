<template>
  <el-config-provider :button="buttonConfig" :size="componentSize" :locale="zhCn">
    <router-view />
    <ChallengeHost />
  </el-config-provider>
</template>
<script lang="ts" setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import ChallengeHost from "@/components/challenge/ChallengeHost.vue";

const componentSize = "default" as any;
const buttonConfig = reactive({
  autoInsertSpace: false,
});
</script>
