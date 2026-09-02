<template>
  <in-tag :value="tagText" />
</template>
<script lang="ts" setup>
import { CommonStatus, CommonStatusEnumExtArray } from "@/models/enums";
import { useEnum } from "@/hooks/biz/useEnum";

const props = defineProps<{
  status?: CommonStatus;
}>();

const statusEnum = useEnum(CommonStatusEnumExtArray);
const tagText = computed(() => {
  if (props.status === undefined) {
    return { text: "", tag: "info" as const };
  }
  return statusEnum.getTagText(props.status);
});
</script>
