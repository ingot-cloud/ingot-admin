<template>
  <div :class="surfaceClass">
    <div v-if="!groups.length" class="text-12px text-[var(--el-text-color-secondary)]">
      {{ emptyText }}
    </div>
    <div v-for="app in groups" :key="app.applicationId" class="flex flex-col gap-12px">
      <div>{{ app.applicationName }}</div>
      <div class="h-1px bg-[var(--in-border-color)]" />
      <div v-for="resource in app.resources" :key="resource.resourceId" class="flex flex-col gap-8px">
        <div class="flex items-center gap-8px">
          <el-icon class="grant-check"><Check /></el-icon>
          <span>{{ resource.resourceName }}</span>
        </div>
        <div
          v-for="action in resource.actions"
          :key="action.id"
          class="pl-24px flex items-center gap-8px min-w-0"
        >
          <el-icon class="grant-check"><Check /></el-icon>
          <span class="truncate">{{ action.name }}</span>
          <in-copy-tag v-if="copyable" :text="action.code" />
          <span v-else class="text-12px text-[var(--el-text-color-secondary)] truncate">
            {{ action.code }}
          </span>
          <in-close-button
            v-if="removable"
            class="ml-auto shrink-0"
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
    removable?: boolean;
    framed?: boolean;
  }>(),
  {
    emptyText: "未关联操作",
    copyable: true,
    removable: false,
    framed: true,
  },
);

const emits = defineEmits<{ remove: [id: string] }>();
const groups = computed(() => groupMenuActions(props.actions));
const surfaceClass = computed(() =>
  props.framed
    ? "rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-16px"
    : "flex flex-col gap-16px",
);
</script>

<style lang="postcss" scoped>
.grant-check {
  color: var(--in-color-primary);
}
</style>
