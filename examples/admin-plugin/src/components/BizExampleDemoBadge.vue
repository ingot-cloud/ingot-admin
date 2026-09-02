<template>
  <el-tag type="success" effect="plain">
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
defineOptions({
  name: "BizExampleDemoBadge",
});

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "BizExampleDemoBadge",
  },
);
</script>
