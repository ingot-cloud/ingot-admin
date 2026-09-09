<template>
  <el-tooltip :disabled="overflowed || disabled" content="帮助" effect="light" placement="bottom">
    <button
      type="button"
      class="in-icon-button in-app-bar-utilities__action gap-8px"
      :class="{ 'is-overflow': overflowed }"
      aria-label="帮助"
      :disabled="disabled"
      @click="privateOnClick"
    >
      <in-icon name="ep:question-filled" class="in-app-bar__icon" />
      <span v-if="overflowed">帮助</span>
    </button>
  </el-tooltip>
</template>
<script setup lang="ts">
import { Message, type InAdminHeaderUtilityComponentProps } from "@ingot/admin-core";

defineOptions({
  name: "BizHeaderHelp",
});

defineProps<InAdminHeaderUtilityComponentProps>();

const privateOnClick = () => {
  Message.success("打开帮助（示例）");
};
</script>
