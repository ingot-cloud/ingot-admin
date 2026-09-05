<template>
  <el-dialog
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    draggable
    class="in-dialog"
    :class="{ 'is-danger': tone === 'danger' }"
  >
    <template #header>
      <div v-if="slots.header">
        <slot name="header" />
      </div>
      <div v-else class="in-custom-title">
        <div class="title">{{ title }}</div>
        <p v-if="description" class="description">{{ description }}</p>
      </div>
    </template>

    <slot />

    <template #footer>
      <div class="in-dialog__footer">
        <slot name="footer"> </slot>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import type { InDialogTone } from "./types";

defineOptions({
  name: "InDialog",
});

const slots = useSlots();
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    tone?: InDialogTone;
  }>(),
  {
    tone: "default",
  },
);
</script>
<style lang="postcss">
.in-dialog {
  & .el-dialog__header {
    border-bottom: 1px solid var(--in-border-color);
    margin-right: 0;
    padding: var(--in-space-4) var(--in-section-padding-relaxed);
  }

  & .el-dialog__footer {
    border-top: 1px solid var(--in-border-color);
    padding: var(--in-space-3) var(--in-section-padding-relaxed);
    background: var(--in-bg-color);
  }

  & .in-dialog__footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--in-space-2);
  }

  & .in-custom-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--in-space-1);

    & .title {
      font-weight: var(--in-font-weight-section-title);
      color: var(--in-text-color);
      font-size: var(--in-font-size-section-title);
      line-height: var(--in-line-height-section-title);
    }

    & .description {
      margin: 0;
      color: var(--in-text-color-secondary);
      font-size: var(--in-font-size-body);
      line-height: var(--in-line-height-body);
    }
  }

  &.is-danger .in-custom-title .title {
    color: var(--in-color-danger);
  }
}
</style>
