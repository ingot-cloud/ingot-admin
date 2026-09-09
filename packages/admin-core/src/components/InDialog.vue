<template>
  <el-dialog
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="showClose"
    :align-center="true"
    draggable
    class="in-dialog"
    :class="{ 'is-danger': tone === 'danger', 'is-no-close': !showClose }"
  >
    <template #header>
      <div v-if="slots.header">
        <slot name="header" />
      </div>
      <div v-else class="in-dialog__title-row">
        <div v-if="slots.icon" class="in-dialog__icon">
          <slot name="icon" />
        </div>
        <div class="in-dialog__texts">
          <div class="title">{{ title }}</div>
          <p v-if="description" class="description">{{ description }}</p>
        </div>
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
    showClose?: boolean;
  }>(),
  {
    tone: "default",
    showClose: true,
  },
);
</script>
<style lang="postcss">
.in-dialog {
  border-radius: var(--in-radius-card);
  box-shadow: var(--in-shadow-overlay);

  & .el-dialog__header {
    border-bottom: 1px solid var(--in-border-color);
    margin-right: 0;
    padding: var(--in-space-4) var(--in-section-padding-relaxed);
  }

  &.is-no-close .el-dialog__header {
    padding-right: var(--in-section-padding-relaxed);
  }

  & .el-dialog__body {
    padding: var(--in-space-4) var(--in-section-padding-relaxed);

    & .el-form-item:last-child {
      margin-bottom: 0;
    }
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

  & .in-dialog__title-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--in-space-3);
  }

  & .in-dialog__icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    color: var(--in-color-warning);
  }

  &.is-danger .in-dialog__icon {
    color: var(--in-color-danger);
  }

  & .in-dialog__texts {
    min-width: 0;
    flex: 1;
  }

  & .in-dialog__texts .title {
    font-weight: var(--in-font-weight-section-title);
    color: var(--in-text-color);
    font-size: var(--in-font-size-section-title);
    line-height: var(--in-line-height-section-title);
  }

  & .in-dialog__texts .description {
    margin: var(--in-space-2) 0 0;
    color: var(--in-text-color-secondary);
    font-size: var(--in-font-size-body);
    line-height: var(--in-line-height-body);
  }

  &.is-danger .in-dialog__texts .title {
    color: var(--in-color-danger);
  }
}
</style>
