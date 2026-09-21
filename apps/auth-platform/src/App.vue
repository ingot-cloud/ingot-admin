<template>
  <el-config-provider :button="buttonConfig" :size="componentSize" :locale="zhCn">
    <router-view />
    <ChallengeHost />
  </el-config-provider>
</template>
<script lang="ts" setup>
import { reactive } from "vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import ChallengeHost from "@/components/challenge/ChallengeHost.vue";
import { setupAuthSession } from "@/session";

setupAuthSession();

const componentSize = "default" as const;
const buttonConfig = reactive({
  autoInsertSpace: false,
});
</script>
