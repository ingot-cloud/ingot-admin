<template>
  <el-alert
    v-if="preview"
    :type="preview.valid ? 'success' : 'warning'"
    :closable="false"
    :title="preview.valid ? '预览通过，尚未写入' : '预览未通过，不能提交'"
  >
    <ul v-if="preview.errors?.length" class="m-0 pl-16px">
      <li v-for="(item, index) in preview.errors" :key="index">{{ item.message }}</li>
    </ul>
    <ul v-if="preview.warnings?.length" class="m-0 pl-16px">
      <li v-for="(item, index) in preview.warnings" :key="`w-${index}`">{{ item.message }}</li>
    </ul>
  </el-alert>
</template>

<script setup lang="ts">
import type { Preview } from "../models/iam";

defineOptions({ name: "BizIamPreviewAlert" });

defineProps<{
  preview?: Preview | null;
}>();
</script>
