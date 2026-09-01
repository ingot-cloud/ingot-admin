<template>
  <div class="in-app-bar-search">
    <el-input
      v-model="searchValue"
      :placeholder="placeholder"
      :prefix-icon="Search"
      class="in-input"
      clearable
    />
  </div>
</template>
<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";

defineProps({
  placeholder: {
    type: String,
    default: "搜索功能",
  },
});

const searchValue = ref("");
</script>
<style lang="postcss" scoped>
.in-app-bar-search {
  width: 440px;
  color: white;

  & .in-input {
    --el-input-placeholder-color: hsla(0, 0%, 100%, 0.4);
    --el-input-icon-color: hsla(0, 0%, 100%, 0.4);
    --el-input-border-radius: 4px;
    --el-input-border-color: rgba(126, 134, 142, 0.16);
    --el-input-hover-border-color: #00000000;
    --el-input-focus-border-color: #00000000;
    --el-input-bg-color: hsla(0, 0%, 100%, 0.16);
    --el-input-text-color: white;
  }
}
:deep(.el-input__wrapper:hover) {
  background-color: hsla(0, 0%, 100%, 0.24);
}
:deep(.el-input__wrapper.is-focus) {
  background-color: hsla(0, 0%, 100%, 0.24);
}
</style>
