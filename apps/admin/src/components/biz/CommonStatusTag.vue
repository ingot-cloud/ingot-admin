<template>
  <in-tag :value="statusEnum.getTagText(status)" />
</template>
<script lang="ts" setup>
import { CommonStatusEnumExtArray } from "@base/models/enums";
defineProps(["status"]);
const statusEnum = useEnum(CommonStatusEnumExtArray);
</script>
