<template>
  <div class="flex flex-col gap-20px max-w-720px">
    <div v-if="showProfile" class="flex flex-col gap-8px">
      <div>编码：{{ profile.code || "-" }}</div>
      <div>名称：{{ profile.name || "-" }}</div>
      <div>说明：{{ profile.description || "-" }}</div>
      <div>分组：{{ profile.groupName || "-" }}</div>
    </div>
    <div v-if="hint" class="text-12px text-[var(--el-text-color-secondary)]">{{ hint }}</div>
    <div>
      <div class="mb-8px">权限</div>
      <grant-preview :grants="grants" />
    </div>
  </div>
</template>

<script setup lang="ts">
import GrantPreview from "./GrantPreview.vue";
import type { SelectedGrant, WizardProfile } from "../wizard";

defineOptions({ name: "PreviewPanel" });

withDefaults(
  defineProps<{
    profile: WizardProfile;
    grants: SelectedGrant[];
    showProfile?: boolean;
    hint?: string;
  }>(),
  {
    showProfile: true,
    hint: "这次只发布首个版本，不会把角色分给任何人，也不会升级已有授权。",
  },
);
</script>
