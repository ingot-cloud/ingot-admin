<template>
  <el-form-item :label="label" :prop="prop" :required="required">
    <template v-if="slots.label" #label>
      <slot name="label" />
    </template>
    <div
      class="in-detail-field"
      :class="{ 'is-editing': isEditing, 'has-editor': hasEditor }"
    >
      <div v-if="hasEditor" class="in-detail-field__editor">
        <slot />
      </div>
      <div class="in-detail-field__value">
        <slot name="view">{{ displayValue }}</slot>
      </div>
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { formatDescriptionValue } from "../description/formatDescriptionValue";
import { inFormContextKey } from "./context";

defineOptions({
  name: "InDetailField",
});

const props = defineProps<{
  label: string;
  prop?: string;
  value?: unknown;
  required?: boolean;
  editing?: boolean;
}>();

const slots = useSlots();
const form = inject(inFormContextKey, null);
const hasEditor = computed(() => typeof slots.default === "function");
const isEditing = computed(() => {
  if (typeof props.editing === "boolean") {
    return props.editing;
  }
  return form?.editing.value ?? false;
});
const displayValue = computed(() => formatDescriptionValue(props.value));
</script>
<style lang="postcss" scoped>
.in-detail-field {
  width: 100%;
  min-width: 0;
}

.in-detail-field.is-editing.has-editor {
  --in-detail-field-editor-display: block;
  --in-detail-field-value-display: none;
}

.in-detail-field__editor {
  display: var(--in-detail-field-editor-display, none);
  min-width: 0;
  width: 100%;
}

.in-detail-field__value {
  display: var(--in-detail-field-value-display, block);
  min-width: 0;
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  color: var(--in-text-color);
  letter-spacing: 0;
  overflow-x: auto;
  border-radius: var(--in-radius-control);
}
</style>
