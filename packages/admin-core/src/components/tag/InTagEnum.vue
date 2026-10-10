<template>
  <in-tag :value="tagText" @click="emit('click', $event)" @close="emit('close', $event)">
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
    <slot>{{ tagText.text }}</slot>
  </in-tag>
</template>
<script lang="ts" setup>
import type { EnumObj, TagText } from "@/models";
import InTag from "./InTag.vue";

defineOptions({ name: "InTagEnum" });

const props = defineProps<{
  value?: string | number;
  enumObj: Pick<EnumObj<never>, "getTagText">;
}>();

const tagText = computed((): TagText => props.enumObj.getTagText(props.value as never));

const emit = defineEmits<{
  click: [event: MouseEvent];
  close: [event: MouseEvent];
}>();
</script>
