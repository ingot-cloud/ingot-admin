<template>
  <div class="in-container" :style="{ padding: `${padding}`, borderRadius: `${radius}` }">
    <el-backtop v-if="showBacktop" target=".in-container" :right="60" :bottom="60">
      <div flex items-center justify-center>
        <i-material-symbols:vertical-align-top-rounded />
      </div>
    </el-backtop>
    <div h-full w-full ref="ContentRef">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  showBacktop: {
    type: Boolean,
    default: true,
  },
  padding: {
    type: String,
    default: "var(--in-common-padding)",
  },
  radius: {
    type: String,
    default: "var(--in-common-border-radius)",
  },
});

const ContentRef = ref();

defineExpose({
  getContentSize() {
    return {
      height: getComputedStyle(ContentRef.value).height,
      width: getComputedStyle(ContentRef.value).width,
    };
  },
});
</script>

<style lang="postcss" scoped>
.in-container {
  @apply w-full h-full box-border overflow-x-hidden shadow-sm bg-[var(--in-bg-color)];
}
</style>
