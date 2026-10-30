<template>
  <el-config-provider :button="buttonConfig" :size="componentSize" :locale="zhCn">
    <router-view />
    <ChallengeHost />
  </el-config-provider>
</template>
<script lang="ts" setup>
import { reactive } from "vue";
import { useAuthAppearance } from "@ingot/auth-plugin";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import ChallengeHost from "@/components/challenge/ChallengeHost.vue";
import { setupAuthSession } from "@/session";

useAuthAppearance(import.meta.env.VITE_APP_LOGIN_COLOR_SCHEME);
setupAuthSession();

const componentSize = "default" as const;
const buttonConfig = reactive({
  autoInsertSpace: false,
});
</script>
