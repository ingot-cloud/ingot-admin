<template>
  <div class="rounded-4px p-12px bg-[var(--in-permission-panel-bg)] text-12px">
    <div class="mb-8px">固定版本字段权限（只读继承）</div>
    <div
      v-if="!Object.keys(permissions ?? {}).length"
      class="text-[var(--el-text-color-secondary)]"
    >
      本版本未声明字段权限，后端按隐藏处理
    </div>
    <div v-for="(fields, resourceId) in permissions" :key="resourceId" class="mb-8px">
      <div>{{ names[resourceId] || `资源 ${resourceId}` }}</div>
      <div v-for="field in resourceFieldKeys(fields)" :key="field" class="pl-12px">
        {{ field }}：{{
          fieldAccessLabel(resourceFieldAccess(fields, field), fields.operations[field])
        }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ResourceFieldPermissions } from "../models/iam";
import { fieldAccessLabel, resourceFieldAccess, resourceFieldKeys } from "../models/iam/roleFields";
defineOptions({ name: "BizIamRoleFieldSummary" });
withDefaults(
  defineProps<{ permissions?: ResourceFieldPermissions | null; names?: Record<string, string> }>(),
  { names: () => ({}) },
);
</script>
