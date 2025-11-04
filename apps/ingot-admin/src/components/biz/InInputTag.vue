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

const model = defineModel({
  type: String,
});

const innerModel = computed({
  get() {
    return model.value?.split(",");
  },
  set(value: any) {
    model.value = value.join(",");
  },
});
</script>
