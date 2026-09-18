<template>
  <el-input class="in-login-input">
    <template #append v-if="slot.action">
      <slot name="action"> </slot>
    </template>
  </el-input>
</template>
<script setup lang="ts">
const slot = useSlots();
</script>
<style lang="postcss">
.in-login-input {
  --el-input-bg-color: #f2f2f6;
  --el-fill-color-light: #f2f2f6;
  --el-border-color: #00000000;
  --el-color-danger: #00000000;
  --el-input-hover-border-color: #00000000;
  --el-input-focus-border-color: #00000000;

  height: var(--login-item-height);

  & .el-input__inner {
    font-size: 15px;
    color: #171a1d;
  }

  & .el-input__clear {
    font-size: 18px;
  }

  & .el-input__password {
    font-size: 18px;
  }

  & .el-input-group__append {
    padding: 0;
  }
}
</style>
