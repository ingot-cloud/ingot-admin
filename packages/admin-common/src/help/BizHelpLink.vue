<template>
  <button v-if="help" type="button" class="biz-help-link" @click="privateOpen">
    <span aria-hidden="true">?</span>
    使用说明
  </button>
</template>
<script setup lang="ts">
import { useHelpNavigation } from "./navigation";
import { Message } from "@ingot/admin-core";

const props = defineProps<{ viewPath?: string; articleId?: string }>();
const help = useHelpNavigation();
const privateOpen = async (): Promise<void> => {
  try {
    if (props.articleId) await help?.openArticle(props.articleId);
    else if (props.viewPath) await help?.openForView(props.viewPath);
  } catch (error) {
    Message.warning(error instanceof Error ? error.message : "帮助说明暂不可用");
  }
};
</script>
<style scoped>
.biz-help-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 0;
  color: var(--el-color-primary);
  font-size: 13px;
  cursor: pointer;
  padding: 5px 0;
  white-space: nowrap;
}
.biz-help-link span {
  display: inline-grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 11px;
}
.biz-help-link:hover {
  text-decoration: underline;
}
.biz-help-link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 4px;
  border-radius: 3px;
}
</style>
