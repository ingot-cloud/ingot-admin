<template>
  <el-drawer class="in-drawer" direction="rtl" :close-on-click-modal="false">
    <template #header>
      <div v-if="slots.header">
        <slot name="header" />
      </div>
      <div v-else class="in-custom-title">
        <div class="rect" />
        <div class="title">{{ title }}</div>
      </div>
    </template>

    <div :style="`padding: ${padding}`" v-loading="loading">
      <slot />
    </div>

    <template #footer>
      <div flex flex-row justify-end items-center>
        <slot name="footer"> </slot>
      </div>
    </template>
  </el-drawer>
</template>
<script lang="ts" setup>
const slots = useSlots();
defineProps({
  title: {
    type: String,
  },
  padding: {
    type: String,
    default: "20px",
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
    padding: 20px;
  }

  & .el-drawer__footer {
    padding: 20px;
    box-shadow: 0px 6px 8px 6px rgba(0, 0, 0, 0.08);
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
