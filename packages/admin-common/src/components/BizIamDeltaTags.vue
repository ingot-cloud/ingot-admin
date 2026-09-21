<template>
  <div class="flex flex-wrap gap-8px">
    <el-tag v-for="item in items" :key="item.actionId + item.operation" :type="tagType(item.operation)">
      {{ operationLabel(item.operation) }} · {{ item.actionId }}
    </el-tag>
    <span v-if="!items.length" class="text-[var(--el-text-color-secondary)]">无版本差异</span>
  </div>
</template>

<script setup lang="ts">
import {
  RoleDeltaOperation,
  useRoleDeltaOperationEnum,
  type RoleDelta,
} from "../models/iam";

defineOptions({ name: "BizIamDeltaTags" });

withDefaults(
  defineProps<{
    items?: RoleDelta[];
  }>(),
  {
    items: () => [],
  },
);

const operationEnum = useRoleDeltaOperationEnum();

const operationLabel = (operation: RoleDeltaOperation): string =>
  operationEnum.getTagText(operation).text;

const tagType = (operation: RoleDeltaOperation): "success" | "danger" | "warning" => {
  if (operation === RoleDeltaOperation.ADD) {
    return "success";
  }
  if (operation === RoleDeltaOperation.REMOVE) {
    return "danger";
  }
  return "warning";
};
</script>
