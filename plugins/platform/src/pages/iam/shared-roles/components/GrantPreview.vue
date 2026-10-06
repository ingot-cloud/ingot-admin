<template>
  <div
    class="grant-preview rounded-4px px-16px py-16px bg-[var(--in-permission-panel-bg)] flex flex-col gap-16px"
  >
    <div v-if="!groups.length" class="text-12px text-[var(--el-text-color-secondary)]">
      暂无权限
    </div>
    <div v-for="app in groups" :key="app.applicationId" class="flex flex-col gap-12px">
      <div>{{ app.applicationName }}</div>
      <div class="h-1px bg-[var(--in-border-color)]" />
      <div
        v-for="resource in app.resources"
        :key="resource.resourceId"
        class="flex flex-col gap-8px"
      >
        <div class="flex items-center gap-8px">
          <el-icon class="grant-check"><Check /></el-icon>
          <span>{{ resource.resourceName }}</span>
        </div>
        <div
          v-if="resource.grants[0]?.fieldCapabilities?.length"
          class="pl-24px text-12px text-[var(--el-text-color-secondary)]"
        >
          <div v-for="field in resource.grants[0].fieldCapabilities" :key="field.key">
            {{ field.label }}（{{ field.key }}）：{{ fieldLabel(resource.grants[0], field.key) }}
          </div>
        </div>
        <div
          v-for="grant in resource.grants"
          :key="grant.actionId"
          class="pl-24px flex flex-col gap-4px"
        >
          <div class="flex items-center gap-8px">
            <el-icon class="grant-check"><Check /></el-icon>
            <span>{{ grant.actionName }}</span>
          </div>
          <div class="pl-24px text-12px text-[var(--el-text-color-secondary)]">
            {{ formatScopeLine(grant.scopes[0] ?? { kind: ScopeKind.ALL }) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { ScopeKind } from "@ingot/admin-common";
import { formatScopeLine, groupGrants, type SelectedGrant } from "../wizard";

defineOptions({ name: "GrantPreview" });

const props = defineProps<{
  grants: SelectedGrant[];
}>();

const fieldLabel = (grant: SelectedGrant, key: string): string => {
  const access = grant.fieldPermissions?.[key] ?? grant.fieldDefaults?.[key];
  return `${{ HIDDEN: "隐藏", MASKED: "脱敏", FULL: "完整可见" }[access?.visibility ?? "HIDDEN"]}${access?.editable ? "，可编辑" : "，只读"}`;
};
const groups = computed(() => groupGrants(props.grants));
</script>

<style lang="postcss" scoped>
.grant-preview {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.grant-check {
  color: var(--in-color-primary);
}
</style>
