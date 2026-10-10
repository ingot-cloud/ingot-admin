<template>
  <el-tag
    class="in-tag"
    :type="value.tag"
    @click="emit('click', $event)"
    @close="emit('close', $event)"
  >
    <span v-if="$slots.icon" class="in-tag__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span class="in-tag__content">
      <slot>{{ value.text }}</slot>
    </span>
  </el-tag>
</template>
<script lang="ts" setup>
import { ElTag } from "element-plus";
import type { TagText } from "@/models";

defineOptions({ name: "InTag" });

defineProps<{
  value: TagText;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
  close: [event: MouseEvent];
}>();
</script>
