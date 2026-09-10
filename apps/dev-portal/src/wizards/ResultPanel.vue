<template>
  <el-alert :title="`已生成 ${result.targetDir}`" type="success" :closable="false" class="mt-16px">
    <p>不会自动安装依赖或改现有 App。请按下列步骤接入：</p>
    <ol>
      <li v-for="step in result.nextSteps" :key="step.title">
        <strong>{{ step.title }}</strong>
        <code v-if="step.command">{{ step.command }}</code>
        <pre v-if="step.code">{{ step.code }}</pre>
      </li>
    </ol>
  </el-alert>
</template>

<script setup lang="ts">
import type { ScaffoldPreview } from "../api/client";

defineProps<{
  result: { targetDir: string; packageName: string; nextSteps: ScaffoldPreview["nextSteps"] };
}>();
</script>
