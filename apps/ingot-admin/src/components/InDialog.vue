<template>
  <el-dialog
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    draggable
    class="in-dialog"
  >
    <template #header>
      <div v-if="slots.header">
        <slot name="header" />
      </div>
      <div v-else class="in-custom-title">
        <div class="rect" />
        <div class="title">{{ title }}</div>
      </div>
    </template>

    <slot />

    <template #footer>
      <div flex flex-row justify-end items-center gap-4>
        <slot name="footer"> </slot>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
const slots = useSlots();
defineProps({
  title: {
    type: String,
  },
});
</script>
<style lang="postcss">
.in-dialog {
  & .el-dialog__header {
    border-bottom: 1px solid var(--in-border-color);
    margin-right: 0;
  }

  & .in-custom-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    grid-gap: 10px;
    & .rect {
      width: 4px;
      height: 14px;
      background: var(--in-color-primary);
      border-radius: 2px;
    }
    & .title {
      font-weight: bold;
      color: #192f48;
      font-size: 18px;
    }
  }
}
</style>
