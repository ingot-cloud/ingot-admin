<template>
  <el-tag :type="tagText.tag">
    {{ tagText.text }}
  </el-tag>
</template>
<script lang="ts" setup>
import type { EnumObj, TagText } from "@/models";

const props = defineProps<{
  value?: string | number;
  enumObj: Pick<EnumObj<never>, "getTagText">;
}>();

const tagText = computed((): TagText => props.enumObj.getTagText(props.value as never));
</script>
