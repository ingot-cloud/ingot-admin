<template>
  <div class="in-table-tree-cell" :style="{ paddingLeft: indent }">
    <button
      v-if="expandable"
      type="button"
      class="in-table-tree-expand"
      :class="{ 'is-expanded': expanded }"
      :aria-label="expanded ? '收起' : '展开'"
      @click.stop="privateOnToggleExpand"
    />
    <span v-else-if="checkboxMode !== 'off'" class="in-table-tree-expand-spacer" />
    <el-checkbox
      v-if="checkboxMode !== 'off'"
      :model-value="checked"
      :disabled="checkboxMode === 'disabled'"
      @change="privateOnChange"
      @click.stop
    />
    <div class="in-table-tree-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { InTableCheckboxMode } from "./checkboxMode";

defineOptions({
  name: "InTableTreeCell",
});

defineProps<{
  indent: string;
  expandable: boolean;
  expanded: boolean;
  checkboxMode: InTableCheckboxMode;
  checked: boolean;
}>();

const emits = defineEmits<{
  "toggle-expand": [];
  change: [checked: boolean];
}>();

const privateOnToggleExpand = (): void => {
  emits("toggle-expand");
};

const privateOnChange = (value: boolean | string | number): void => {
  emits("change", value === true);
};
</script>
