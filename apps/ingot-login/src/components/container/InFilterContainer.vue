<template>
  <div class="in-filter-container">
    <div class="left-filter" v-if="slot.left">
      <slot name="left"> </slot>
    </div>
    <el-container class="right-container">
      <div class="top-filter" v-if="slot.top">
        <slot name="top"> </slot>
      </div>
      <div class="inner-container">
        <el-backtop v-if="showBacktop" target=".inner-container" :right="60" :bottom="60">
          <div flex items-center justify-center>
            <i-material-symbols:vertical-align-top-rounded />
          </div>
        </el-backtop>
        <slot />
      </div>
    </el-container>
  </div>
</template>
<script lang="ts" setup>
defineProps({
  showBacktop: {
    type: Boolean,
    default: true,
  },
});

const slot = useSlots();
</script>
<style lang="postcss" scoped>
.in-filter-container {
  @apply w-full h-full flex flex-row;
  & .left-filter {
    @apply m-r-[var(--in-common-margin)] p-[var(--in-common-padding)] bg-[var(--in-bg-color)];
  }
  & .right-container {
    @apply flex flex-col;
    & .top-filter {
      @apply m-b-[var(--in-common-margin)] p-[var(--in-common-padding)] bg-[var(--in-bg-color)];
    }
    & .inner-container {
      @apply flex-1 box-border overflow-x-hidden p-[var(--in-common-padding)] bg-[var(--in-bg-color)];
    }
  }
}
</style>
