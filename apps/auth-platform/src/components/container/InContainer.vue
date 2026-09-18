<template>
  <div class="in-container">
    <el-backtop v-if="showBacktop" target=".in-container" :right="60" :bottom="60">
      <div flex items-center justify-center>
        <i-material-symbols:vertical-align-top-rounded />
      </div>
    </el-backtop>
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps({
  showBacktop: {
    type: Boolean,
    default: true,
  },
});
</script>

<style lang="postcss" scoped>
.in-container {
  @apply w-full h-full box-border overflow-x-hidden p-[var(--in-common-padding)] shadow-sm bg-[var(--in-bg-color)];
}
</style>
