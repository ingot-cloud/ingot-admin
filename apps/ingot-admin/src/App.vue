<template>
  <el-config-provider :button="buttonConfig" :size="componentSize" :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
<script lang="ts" setup>
import { useAppStateStore } from "@/stores/modules/app";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";

const { componentSize } = storeToRefs(useAppStateStore());
const buttonConfig = reactive({
  autoInsertSpace: false,
});
const route = useRoute();

watch(
  () => route.path,
  () => {
    useInWebTitle();
  },
  {
    deep: true,
  },
);
</script>
