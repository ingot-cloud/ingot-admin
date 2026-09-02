<template>
  <el-tag :type="value.tag">
    {{ value.text }}
  </el-tag>
</template>
<script lang="ts" setup>
import type { TagText } from "@/models";

defineProps<{
  value: TagText;
}>();
</script>
