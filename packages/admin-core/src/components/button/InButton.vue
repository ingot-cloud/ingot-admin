<template>
  <el-button @click="privateOnClick">
    <span v-if="slots.icon"> <slot name="icon"> </slot> </span>
    <slot></slot>
  </el-button>
</template>
<script lang="ts" setup>
const slots = useSlots();
const emits = defineEmits(["in-click"]);
const triggerClick = useThrottleFn((e: MouseEvent) => {
  emits("in-click", e);
}, 1200);
const privateOnClick = (e: MouseEvent) => {
  triggerClick(e);
};
</script>
