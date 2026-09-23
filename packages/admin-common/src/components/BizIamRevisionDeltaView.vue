<template>
  <el-tag v-if="!items.length && initial" type="info">初始版本</el-tag>
  <span v-else-if="!items.length">-</span>
  <in-button v-else type="primary" text link @in-click="privateOpen">{{ summary }}</in-button>
  <in-dialog v-model="visible" :title="dialogTitle" :description="dialogDescription" width="560" append-to-body>
    <div class="flex flex-col gap-16px max-h-420px overflow-auto">
      <div v-for="group in groups" :key="group.operation" class="flex flex-col gap-8px">
        <div>{{ group.label }}（{{ group.items.length }}）</div>
        <div v-for="item in group.items" :key="item.actionId + item.operation" class="pl-12px flex flex-col gap-4px">
          <div>{{ actionLabel(item.actionId) }}</div>
          <div v-if="scopeText(item)" class="text-12px text-[var(--el-text-color-secondary)]">
            {{ scopeText(item) }}
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="privateClose">关闭</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import {
  RoleDeltaOperation,
  formatScopeKinds,
  useRoleDeltaOperationEnum,
  type RoleDelta,
} from "../models/iam";

defineOptions({ name: "BizIamRevisionDeltaView" });

const props = withDefaults(
  defineProps<{
    items?: RoleDelta[];
    actionNames?: Record<string, string>;
    revision?: string;
    initial?: boolean;
  }>(),
  {
    items: () => [],
    actionNames: () => ({}),
    revision: "",
    initial: false,
  },
);

const visible = ref(false);
const operationEnum = useRoleDeltaOperationEnum();
const groupOrder = [
  RoleDeltaOperation.ADD,
  RoleDeltaOperation.REMOVE,
  RoleDeltaOperation.REPLACE_SCOPE,
] as const;

const actionLabel = (actionId: string): string => props.actionNames[actionId] || actionId;

const operationLabel = (operation: RoleDeltaOperation): string =>
  operationEnum.getTagText(operation).text;

const scopeText = (item: RoleDelta): string => {
  const kinds = (item.scopes ?? []).map((scope) => scope.kind);
  return kinds.length ? formatScopeKinds(kinds) : "";
};

const countOf = (operation: RoleDeltaOperation): number =>
  props.items.filter((item) => item.operation === operation).length;

const summary = computed(() => {
  const parts = groupOrder
    .map((operation) => {
      const count = countOf(operation);
      return count ? `${operationLabel(operation)} ${count}` : "";
    })
    .filter(Boolean);
  return parts.join(" · ") || "查看变更";
});

const groups = computed(() =>
  groupOrder
    .map((operation) => ({
      operation,
      label: operationLabel(operation),
      items: props.items.filter((item) => item.operation === operation),
    }))
    .filter((group) => group.items.length),
);

const dialogTitle = computed(() =>
  props.revision ? `版本 ${props.revision} 变更` : "版本变更",
);

const dialogDescription = computed(() => `共 ${props.items.length} 项变更`);

const privateOpen = (): void => {
  visible.value = true;
};

const privateClose = (): void => {
  visible.value = false;
};
</script>
