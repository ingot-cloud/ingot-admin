<template>
  <el-input class="in-login-input">
    <template v-if="slots.action" #append>
      <slot name="action" />
    </template>
  </el-input>
</template>

<script lang="ts" setup>
import { useSlots } from "vue";
import { ElInput } from "element-plus";

defineOptions({ name: "LoginInput" });

const slots = useSlots();
</script>

<style lang="postcss" scoped>
.in-login-input {
  --el-input-bg-color: #f2f2f6;
  --el-fill-color-light: #f2f2f6;
  --el-border-color: #00000000;
  --el-color-danger: #00000000;
  --el-input-hover-border-color: #00000000;
  --el-input-focus-border-color: #00000000;

  height: var(--login-item-height, 48px);

  :deep(.el-input__wrapper) {
    padding-left: 12px;
    padding-right: 12px;
    box-shadow: none;
  }

  :deep(.el-input__inner) {
    font-size: 15px;
    color: #171a1d;
  }

  :deep(.el-input__clear),
  :deep(.el-input__password) {
    font-size: 18px;
  }

  :deep(.el-input-group__append) {
    padding: 0;
    box-shadow: none;
    background: #f2f2f6;
  }
}
</style>
