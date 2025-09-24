<template>
  <el-icon>
    <i-ep:refresh-right @click="privateOnRefreshClick" :class="[!ready ? 'do-refresh' : '']" />
  </el-icon>
</template>
<script lang="ts" setup>
const { ready, start } = useTimeout(1000, { controls: true });
const emits = defineEmits(["refresh"]);
const privateOnRefreshClick = () => {
  if (!ready.value) {
    return;
  }
  start();
  emits("refresh");
};
</script>
<style lang="postcss" scoped>
.do-refresh {
  transition: all 1s;
  transform: rotate(360deg);
}
</style>
