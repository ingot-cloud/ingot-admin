<template>
  <in-button :type="params?.type">
    <template #icon>
      <Icon :icon="params?.icon ?? ''" />
    </template>
    {{ params?.title }}
  </in-button>
</template>
<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { CommonStatus, getDisableButtonParams } from "@/models/enums";

const props = defineProps<{
  status?: CommonStatus;
}>();

const params = computed(() =>
  props.status === undefined ? undefined : getDisableButtonParams(props.status),
);
</script>
