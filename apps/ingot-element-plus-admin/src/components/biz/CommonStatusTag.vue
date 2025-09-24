<template>
  <in-tag :value="statusEnum.getTagText(status)" />
</template>
<script lang="ts" setup>
import { CommonStatusEnumExtArray } from "@/models/enums";
defineProps(["status"]);
const statusEnum = useEnum(CommonStatusEnumExtArray);
</script>
