<template>
  <el-config-provider :button="buttonConfig" :size="componentSize" :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
<script lang="ts" setup>
import zhCn from "element-plus/dist/locale/zh-cn.mjs";

const componentSize = "default" as any;
const buttonConfig = reactive({
  autoInsertSpace: false,
});
</script>
