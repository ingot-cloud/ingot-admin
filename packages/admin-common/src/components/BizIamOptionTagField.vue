<template>
  <in-selection-field
    :items="model"
    :show-avatar="false"
    closable
    :placeholder="placeholder"
    @click="emits('pick')"
    @remove="privateRemove($event.id)"
  />
</template>

<script setup lang="ts">
import { InSelectionField } from "@ingot/admin-core";
import type { IamSelectOption } from "../models/iam";

defineOptions({ name: "BizIamOptionTagField" });

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: "请选择",
  },
);

const model = defineModel<IamSelectOption[]>({ default: () => [] });
const emits = defineEmits<{ pick: [] }>();

const privateRemove = (id: string): void => {
  model.value = model.value.filter((item) => item.id !== id);
};
</script>
