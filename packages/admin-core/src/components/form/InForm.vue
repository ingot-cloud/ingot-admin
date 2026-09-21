<template>
  <el-form
    ref="inElForm"
    class="in-detail-form"
    :class="{ 'is-editing': editing }"
    label-width="100px"
    label-position="top"
  >
    <slot />
  </el-form>
</template>
<script setup lang="ts">
import { inFormContextKey } from "./context";

defineOptions({
  name: "InForm",
});

const props = withDefaults(
  defineProps<{
    editing?: boolean;
  }>(),
  {
    editing: true,
  },
);

const inElForm = ref();
const editing = toRef(props, "editing");

provide(inFormContextKey, {
  editing,
});

defineExpose({
  validate(fn: (valid: boolean) => void) {
    inElForm.value.validate(fn);
  },
  resetFields() {
    inElForm.value.resetFields();
  },
  clearValidate() {
    inElForm.value.clearValidate();
  },
});
</script>
<style lang="postcss" scoped>
.in-detail-form {
  --in-detail-field-editor-display: none;
  --in-detail-field-value-display: block;

  &.is-editing {
    --in-detail-field-editor-display: block;
  }

  &.is-editing :deep(.in-detail-field.has-editor) {
    --in-detail-field-value-display: none;
  }

  :deep(.el-form-item) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--in-space-2);
    margin-bottom: var(--in-space-5);
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    display: block;
    float: none;
    justify-content: flex-start;
    min-height: var(--in-line-height-body);
    margin-bottom: 0;
    padding: 0;
    color: var(--in-text-color-placeholder);
    font-size: var(--in-font-size-body);
    line-height: var(--in-line-height-body);
    letter-spacing: 0;
    transition: color 0.3s ease-in-out;
  }

  :deep(.el-form-item__content) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    min-width: 0;
    font-size: var(--in-font-size-body);
    letter-spacing: 0;
    color: var(--in-text-color);
  }

  :deep(.in-detail-field),
  :deep(.in-detail-field__editor),
  :deep(.el-input),
  :deep(.el-textarea) {
    width: 100%;
    min-width: 0;
  }

  &.is-editing :deep(.el-form-item__label) {
    color: var(--in-text-color);
  }

  &:not(.is-editing) :deep(.el-form-item.is-required > .el-form-item__label::before) {
    display: none;
  }
}
</style>
