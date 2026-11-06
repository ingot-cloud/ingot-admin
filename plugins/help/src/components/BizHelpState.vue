<template>
  <div v-if="loading" class="help-state" role="status" aria-live="polite">
    <div class="help-skeleton-line" />
    <div class="help-skeleton-line is-short" />
    <div class="help-skeleton-line" />
    <span class="sr-only">正在加载帮助内容</span>
  </div>
  <div v-else class="help-state" role="status">
    <InIcon :name="empty ? 'ep:search' : 'ep:warning'" class="help-state-icon" />
    <h2>{{ title || (empty ? "没有找到相关说明" : "帮助内容暂不可用") }}</h2>
    <p>
      {{
        message ||
        (empty
          ? "请尝试更简短的关键词，或浏览左侧功能分类。"
          : "请稍后重试，也可以返回管理台继续使用。")
      }}
    </p>
    <div class="help-state-actions">
      <button v-if="!empty" type="button" class="help-primary-button" @click="$emit('retry')">
        重新加载
      </button>
      <button type="button" class="help-text-button" @click="runtime.back()">返回管理台</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useHelpRuntime } from "../runtime";
defineProps<{ loading?: boolean; empty?: boolean; title?: string; message?: string }>();
defineEmits<{ retry: [] }>();
const runtime = useHelpRuntime();
</script>
