<template>
  <in-button :type="tagText.tag">
    {{ tagText.text }}
  </in-button>
</template>
<script lang="ts" setup>
import type { PropType } from "vue";
import type { EnumObj } from "@/models";
const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  enumObj: {
    type: Object as PropType<EnumObj<string>>,
    required: true,
  },
});

const tagText = computed(() => {
  const opposite = props.enumObj.getOpposite(props.value);
  return props.enumObj.getTagText(opposite);
});
</script>
