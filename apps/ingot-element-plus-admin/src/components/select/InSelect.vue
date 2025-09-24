<template>
  <el-select v-model="selectModel" @change="privateOnChanged">
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>
</template>
<script lang="ts" setup>
import type { Option } from "@/models";

const model = defineModel({
  type: [Array, String, Number, Boolean, Object],
});
const props = defineProps({
  split: {
    type: String,
    default: "",
  },
  options: {
    type: Array as PropType<Array<Option<any>>>,
    default() {
      return [];
    },
  },
});
const emits = defineEmits(["onChanged"]);

const selectModel = computed({
  set(value: any) {
    if (props.split && value) {
      model.value = value.join(props.split);
    } else {
      model.value = value;
    }
  },
  get() {
    return props.split && model.value ? (model.value as string).split(props.split) : model.value;
  },
});

const privateOnChanged = (value: any) => {
  emits("onChanged", value);
};
</script>
