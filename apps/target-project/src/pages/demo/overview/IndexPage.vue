<template>
  <in-container>
    <in-page-header title="D · 插件概览" subtitle="验证构建期插件组合与稳定页面键" />
    <el-card shadow="never">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="插件 ID">{{ TARGET_PLUGIN_META.id }}</el-descriptions-item>
        <el-descriptions-item label="API 版本">
          {{ TARGET_PLUGIN_META.apiVersion }}
        </el-descriptions-item>
        <el-descriptions-item label="依赖">
          {{ TARGET_PLUGIN_META.dependsOn.join(", ") }}
        </el-descriptions-item>
        <el-descriptions-item label="稳定页面键">
          <div flex flex-col gap-1>
            <code v-for="key in TARGET_PLUGIN_META.pageKeys" :key="key">{{ key }}</code>
          </div>
        </el-descriptions-item>
      </el-descriptions>
      <p m-t-4 text-sm color-fade>
        本应用由 `ingot-admin-core` + 官方 `ingot-admin` 插件 + `target-feature`
        在构建期组合，运行时共享同一 Vue / Router / Pinia 实例。
      </p>
    </el-card>
  </in-container>
</template>

<script setup lang="ts">
import { TARGET_PLUGIN_META } from "@/plugins/targetPlugin";

defineOptions({
  name: "TargetDemoOverviewPage",
});
</script>
