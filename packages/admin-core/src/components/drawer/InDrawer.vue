<template>
  <el-drawer class="in-drawer" direction="rtl" :close-on-click-modal="false">
    <template #header>
      <div v-if="slots.header">
        <slot name="header" />
      </div>
      <div v-else class="in-custom-title">
        <div class="title">{{ title }}</div>
      </div>
    </template>

    <div class="in-drawer__body" :style="`padding: ${padding}`" v-loading="loading">
      <slot />
    </div>

    <template #footer>
      <div class="in-drawer__footer">
        <slot name="footer"> </slot>
      </div>
    </template>
  </el-drawer>
</template>
<script lang="ts" setup>
defineOptions({
  name: "InDrawer",
});

const slots = useSlots();
defineProps({
  title: {
    type: String,
  },
  padding: {
    type: String,
    default: "var(--in-section-padding-relaxed)",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>
<style lang="postcss">
.in-drawer {
  --el-drawer-padding-primary: 0;

  & .el-drawer__header {
    border-bottom: 1px solid var(--in-border-color);
    margin-bottom: 0;
    padding: var(--in-space-4) var(--in-section-padding-relaxed);
  }

  & .el-drawer__body {
    overflow: auto;
  }

  & .el-drawer__footer {
    padding: var(--in-space-3) var(--in-section-padding-relaxed);
    border-top: 1px solid var(--in-border-color);
    background: var(--in-bg-color);
    box-shadow: none;
  }

  & .in-drawer__footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--in-space-2);
  }

  & .in-custom-title {
    display: flex;
    flex-direction: row;
    align-items: center;

    & .title {
      font-weight: var(--in-font-weight-section-title);
      color: var(--in-text-color);
      font-size: var(--in-font-size-section-title);
      line-height: var(--in-line-height-section-title);
    }
  }
}
</style>
