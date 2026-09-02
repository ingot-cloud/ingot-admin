<template>
  <el-input-tag v-model="innerModel" v-bind="omit($attrs, 'modelValue', 'onUpdate:modelValue')">
    <slot></slot>
  </el-input-tag>
</template>
<script setup lang="ts">
import { omit } from "@/utils/object";

defineOptions({
  inheritAttrs: false,
});

const model = defineModel<string | undefined>();

const innerModel = computed({
  get(): string[] | undefined {
    return model.value?.split(",");
  },
  set(value: string[] | undefined) {
    model.value = value?.join(",");
  },
});
</script>
