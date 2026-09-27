<template>
  <div
    class="option-tag-field"
    role="button"
    tabindex="0"
    :aria-label="placeholder"
    @click="emits('pick')"
    @keydown.enter.prevent="emits('pick')"
  >
    <el-tag
      v-for="item in model"
      :key="item.id"
      closable
      @close.stop="privateRemove(item.id)"
    >
      {{ item.name }}
    </el-tag>
    <span v-if="!model.length" class="option-tag-field__placeholder">{{ placeholder }}</span>
  </div>
</template>

<script setup lang="ts">
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

<style lang="postcss" scoped>
.option-tag-field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  cursor: pointer;
}

.option-tag-field:focus-visible {
  outline: 2px solid var(--in-color-primary);
  outline-offset: 1px;
}

.option-tag-field__placeholder {
  color: var(--el-text-color-placeholder);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}
</style>
