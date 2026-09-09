<template>
  <el-tooltip
    :disabled="overflowed || disabled"
    content="帮助中心"
    effect="light"
    placement="bottom"
  >
    <button
      type="button"
      class="in-icon-button in-app-bar-utilities__action gap-8px"
      :class="{ 'is-overflow': overflowed }"
      aria-label="帮助"
      :disabled="disabled"
      @click="privateOnClick"
    >
      <span class="in-app-bar__icon">
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          data-icon="MaybeOutlined"
        >
          <path
            d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 2C5.925 23 1 18.075 1 12S5.925 1 12 1s11 4.925 11 11-4.925 11-11 11Zm-1-6a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM8.05 9.282a5.17 5.17 0 0 1 .039-.28c.195-1.085.689-1.883 1.481-2.394.62-.405 1.383-.608 2.288-.608 1.189 0 2.176.288 2.962.864.787.575 1.18 1.428 1.18 2.558 0 .693-.17 1.277-.513 1.752-.2.287-.584.655-1.152 1.103l-.56.44c-.305.24-.507.52-.607.84a2.742 2.742 0 0 0-.072.486.5.5 0 0 1-.498.457h-1.12a.5.5 0 0 1-.498-.546c.065-.696.134-1.136.207-1.321.137-.344.49-.74 1.058-1.188l.575-.455c.19-.144 1.166-.831 1.166-1.44 0-.608-.106-.832-.412-1.166-.305-.333-.993-.44-1.613-.44-.61 0-1.132.161-1.387.572-.118.19-.215.393-.284.6a2.097 2.097 0 0 0-.073.307.5.5 0 0 1-.493.415H8.547a.5.5 0 0 1-.497-.556Z"
            fill="currentColor"
          ></path>
        </svg>
      </span>
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
