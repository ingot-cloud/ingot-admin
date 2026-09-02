<template>
  <in-button :type="tagText.tag">
    {{ tagText.text }}
  </in-button>
</template>
<script lang="ts" setup>
import type { EnumObj } from "@/models";

const props = defineProps<{
  value: string;
  enumObj: EnumObj<string>;
}>();

const tagText = computed(() => {
  const opposite = props.enumObj.getOpposite(props.value);
  return props.enumObj.getTagText(opposite);
});
</script>
