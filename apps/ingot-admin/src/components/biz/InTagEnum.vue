<template>
  <el-tag :type="enumObj.getTagText(value!).tag">
    {{ enumObj.getTagText(value!).text }}
  </el-tag>
</template>
<script lang="ts" setup>
import type { PropType } from "vue";
import type { EnumObj } from "@/models";
defineProps({
  value: {
    type: String,
  },
  enumObj: {
    type: Object as PropType<EnumObj<any>>,
    required: true,
  },
});
</script>
