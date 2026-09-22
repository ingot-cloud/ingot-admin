<template>
  <div class="flex flex-col gap-20px max-w-720px">
    <div class="flex flex-col gap-8px">
      <div>编码：{{ profile.code || "-" }}</div>
      <div>名称：{{ profile.name || "-" }}</div>
      <div>说明：{{ profile.description || "-" }}</div>
      <div>分组：{{ profile.groupName || "-" }}</div>
    </div>
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      这次只发布首个版本，不会把角色分给任何人，也不会升级已有授权。
    </div>
    <div>
      <div class="mb-8px">权限</div>
      <div class="rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-16px">
        <div v-for="app in groups" :key="app.applicationId" class="flex flex-col gap-12px">
          <div>{{ app.applicationName }}</div>
          <div class="h-1px bg-[var(--in-border-color)]" />
          <div v-for="resource in app.resources" :key="resource.resourceId" class="flex flex-col gap-8px">
            <div class="flex items-center gap-8px">
              <el-icon class="text-[var(--el-color-primary)]"><Check /></el-icon>
              <span>{{ resource.resourceName }}</span>
            </div>
            <div v-for="grant in resource.grants" :key="grant.actionId" class="pl-24px flex flex-col gap-4px">
              <div class="flex items-center gap-8px">
                <el-icon class="text-[var(--el-color-primary)]"><Check /></el-icon>
                <span>{{ grant.actionName }}</span>
              </div>
              <div class="pl-24px text-12px text-[var(--el-text-color-secondary)]">
                {{ formatScopeLine(grant.scopes[0] ?? { kind: ScopeKind.ALL }) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { ScopeKind } from "@ingot/admin-common";
import { formatScopeLine, groupGrants, type SelectedGrant, type WizardProfile } from "../wizard";

defineOptions({ name: "PreviewPanel" });

const props = defineProps<{
  profile: WizardProfile;
  grants: SelectedGrant[];
}>();

const groups = computed(() => groupGrants(props.grants));
</script>
