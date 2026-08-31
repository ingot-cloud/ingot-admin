<template>
  <in-container>
    <in-page-header title="插件示例页" subtitle="由本地插件注册的稳定页面键" />
    <el-card shadow="never">
      <p>App: {{appCode}}</p>
      <p>Plugin: {{pluginId}}</p>
      <BizTargetDemoBadge />
    </el-card>
  </in-container>
</template>

<script setup lang="ts">
defineOptions({
  name: "DemoOverviewPage",
});
</script>
