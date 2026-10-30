<template>
  <el-input class="in-login-input" />
</template>

<script setup lang="ts">
import { ElInput } from "element-plus";

defineOptions({ name: "LoginInput" });
</script>

<style scoped lang="postcss">
.in-login-input {
  --el-input-bg-color: var(--in-bg-color-surface);
  --el-input-text-color: var(--in-text-color);
  --el-input-placeholder-color: var(--in-text-color-placeholder);
  --el-input-border-color: var(--in-border-color);
  --el-input-hover-border-color: var(--in-text-color-placeholder);
  --el-input-focus-border-color: var(--in-focus-ring-color);
  --el-input-border-radius: var(--in-radius-control);

  height: var(--in-auth-control-height);

  :deep(.el-input__wrapper) {
    padding-inline: var(--in-space-3);
    transition: box-shadow var(--in-motion-duration) var(--in-motion-ease);
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow:
      0 0 0 1px var(--in-focus-ring-color) inset,
      0 0 0 3px color-mix(in srgb, var(--in-focus-ring-color) 12%, transparent);
  }

  :deep(.el-input__inner) {
    font-size: var(--in-font-size-body);
  }

  :deep(.el-input__clear),
  :deep(.el-input__password) {
    font-size: 16px;
  }
}
</style>
