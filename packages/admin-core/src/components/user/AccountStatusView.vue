<template>
  <div v-if="enabled && !locked">
    <el-tag type="success">正常</el-tag>
  </div>
  <div v-else>
    <el-tag v-if="!enabled" type="danger">已禁用</el-tag>
    <el-tag v-else type="danger">已锁定</el-tag>
  </div>
</template>
<script lang="ts" setup>
withDefaults(
  defineProps<{
    enabled?: boolean;
    locked?: boolean;
  }>(),
  {
    enabled: true,
    locked: false,
  },
);
</script>
