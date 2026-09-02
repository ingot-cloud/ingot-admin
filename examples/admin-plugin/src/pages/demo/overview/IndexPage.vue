<template>
  <in-container>
    <in-page-header title="概览" subtitle="验证构建期插件组合与稳定页面键" />
    <el-card shadow="never">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="插件 ID">{{ EXAMPLE_PLUGIN_META.id }}</el-descriptions-item>
        <el-descriptions-item label="API 版本">
          {{ EXAMPLE_PLUGIN_META.apiVersion }}
        </el-descriptions-item>
        <el-descriptions-item label="依赖">
          {{ EXAMPLE_PLUGIN_META.dependsOn.join(", ") }}
        </el-descriptions-item>
        <el-descriptions-item label="稳定页面键">
          <div flex flex-col gap-1>
            <code v-for="key in EXAMPLE_PLUGIN_META.pageKeys" :key="key">{{ key }}</code>
          </div>
        </el-descriptions-item>
      </el-descriptions>
      <p m-t-4 text-sm color-fade>
        将本示例注册到 `apps/admin` 后，由宿主在构建期编译源码插件，运行时共享同一 Vue / Router / Pinia
        实例。
      </p>
    </el-card>
  </in-container>
</template>

<script setup lang="ts">
import { EXAMPLE_PLUGIN_META } from "@/plugin";

defineOptions({
  name: "ExampleDemoOverviewPage",
});
</script>
