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
    default: "搜索功能导航",
  },
});

const searchValue = ref("");
</script>
<style lang="postcss" scoped>
.in-app-bar-search {
  width: var(--in-app-bar-search-width);
  max-width: 100%;
  flex: none;
  color: var(--in-text-color);

  & .in-input {
    --el-input-placeholder-color: var(--in-text-color-placeholder);
    --el-input-icon-color: var(--in-text-color-placeholder);
    --el-input-border-radius: var(--in-radius-control);
    --el-input-border-color: var(--in-border-color);
    --el-input-hover-border-color: var(--in-border-color);
    --el-input-focus-border-color: var(--in-color-primary);
    --el-input-bg-color: var(--in-bg-color-mute);
    --el-input-text-color: var(--in-text-color);
  }
}

@media (max-width: 1279px) {
  .in-app-bar-search {
    width: 200px;
  }
}

@media (max-width: 1023px) {
  .in-app-bar-search {
    width: 140px;
  }
}
</style>
