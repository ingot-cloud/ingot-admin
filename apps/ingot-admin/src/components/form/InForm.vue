<template>
  <el-form ref="inElForm" label-width="100px" label-position="top">
    <slot />
  </el-form>
</template>
<script setup lang="ts">
const inElForm = ref();

defineExpose({
  validate(fn: (valid: boolean) => void) {
    inElForm.value.validate(fn);
  },
  resetFields() {
    inElForm.value.resetFields();
  },
  clearValidate() {
    inElForm.value.clearValidate();
  },
});
</script>
