<template>
  <in-button :type="getDisableButtonParams(status)?.type">
    <template #icon>
      <Icon :icon="getDisableButtonParams(status)?.icon" />
    </template>
    {{ getDisableButtonParams(status)?.title }}
  </in-button>
</template>
<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { getDisableButtonParams } from "@/models";
defineProps(["status"]);
</script>
