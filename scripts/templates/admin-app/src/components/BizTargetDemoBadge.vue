<template>
  <el-tag type="success" effect="plain">
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
defineOptions({
  name: "BizTargetDemoBadge",
});

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "BizTargetDemoBadge",
  },
);
</script>
