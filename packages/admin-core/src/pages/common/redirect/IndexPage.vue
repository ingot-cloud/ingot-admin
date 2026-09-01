<template>
  <div></div>
</template>
<script lang="ts" setup>
import { RedirectPageField } from "@/router";
import { Message } from "@/utils/message";

const props = defineProps({
  [`${RedirectPageField.PATH}`]: String,
  [`${RedirectPageField.TYPE}`]: String,
});

useRedirect(props[RedirectPageField.PATH], props[RedirectPageField.TYPE])
  .then(() => {
    Message.success("刷新成功");
  })
  .catch(() => {
    console.debug("刷新失败");
  });
</script>
