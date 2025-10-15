<template>
  <el-tag :type="value.tag">
    {{ value.text }}
  </el-tag>
</template>
<script lang="ts" setup>
import type { PropType } from "vue";
import type { TagText } from "@/models";
defineProps({
  value: {
    type: Object as PropType<TagText>,
    required: true,
  },
});
</script>
