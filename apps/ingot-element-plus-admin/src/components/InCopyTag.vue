<template>
  <el-tag @click="copy(text)" :class="{ 'in-copy-tag': isSupported }">
    {{ text }}
  </el-tag>
</template>
<script setup lang="ts">
const props = defineProps({
  text: {
    type: String,
  },
  successMessage: {
    type: String,
    default: "复制成功",
  },
});
const { copy, copied, isSupported } = useClipboard({
  source: props.text,
});
const { success } = useMessage();
watch(copied, (value) => {
  if (isSupported.value && value) {
    success(props.successMessage);
  }
});
</script>
<style lang="postcss" scoped>
.in-copy-tag {
  cursor: pointer;
}
</style>
