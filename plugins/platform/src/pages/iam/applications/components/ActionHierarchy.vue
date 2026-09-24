<template>
  <div :class="surfaceClass">
    <div v-if="!groups.length" class="text-12px text-[var(--el-text-color-secondary)]">
      {{ emptyText }}
    </div>
    <div v-for="app in groups" :key="app.applicationId" class="flex flex-col gap-12px min-w-0">
      <div>{{ app.applicationName }}</div>
      <div class="h-1px bg-[var(--in-border-color)]" />
      <div
        v-for="resource in app.resources"
        :key="resource.resourceId"
        class="flex flex-col gap-8px min-w-0"
      >
        <div class="flex items-center gap-8px min-w-0">
          <el-icon class="grant-check shrink-0"><Check /></el-icon>
          <span class="truncate min-w-0">{{ resource.resourceName }}</span>
        </div>
        <div
          v-for="action in resource.actions"
          :key="action.id"
          class="action-row pl-24px min-w-0 items-center gap-8px"
          :class="{ 'is-removable': removable }"
        >
          <el-icon class="grant-check"><Check /></el-icon>
          <span class="truncate min-w-0">{{ action.name }}</span>
          <span v-if="showCode && copyable" class="action-code min-w-0 overflow-hidden">
            <in-copy-tag :text="action.code" />
          </span>
          <span
            v-else-if="showCode"
            class="min-w-0 truncate text-12px text-[var(--el-text-color-secondary)]"
          >
            {{ action.code }}
          </span>
          <in-close-button
            v-if="removable"
            class="action-remove"
            size="sm"
            :label="`移除 ${action.name}`"
            @click="emits('remove', action.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { InCloseButton } from "@ingot/admin-core";
import { groupMenuActions, type MenuActionOption } from "../menuActions";

defineOptions({ name: "ActionHierarchy" });

const props = withDefaults(
  defineProps<{
    actions: MenuActionOption[];
    emptyText?: string;
    copyable?: boolean;
    showCode?: boolean;
    removable?: boolean;
    framed?: boolean;
  }>(),
  {
    emptyText: "未关联操作",
    copyable: true,
    showCode: true,
    removable: false,
    framed: true,
  },
);

const emits = defineEmits<{ remove: [id: string] }>();
const groups = computed(() => groupMenuActions(props.actions));
const surfaceClass = computed(() =>
  props.framed
    ? "box-border rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-16px min-w-0 w-full max-w-full overflow-x-hidden"
    : "box-border flex flex-col gap-16px min-w-0 w-full max-w-full",
);
</script>

<style lang="postcss" scoped>
.action-row {
  display: grid;
  grid-template-columns: auto minmax(0, max-content) minmax(0, 1fr);
}

.action-row.is-removable {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.action-row.is-removable:has(.action-code),
.action-row.is-removable:has(.text-12px) {
  grid-template-columns: auto minmax(0, max-content) minmax(0, 1fr) auto;
}

.action-remove {
  justify-self: end;
}

.grant-check {
  color: var(--in-color-primary);
}

.action-code {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.action-code :deep(.el-tag) {
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  vertical-align: middle;
}

.action-code :deep(.el-tag__content) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
