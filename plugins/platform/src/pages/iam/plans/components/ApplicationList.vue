<template>
  <div class="rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-16px min-w-0">
    <div v-if="!items.length" class="text-12px text-[var(--el-text-color-secondary)]">未绑定应用</div>
    <div v-for="item in items" :key="item.id" class="flex flex-col gap-8px min-w-0">
      <div class="flex items-center gap-8px min-w-0">
        <el-icon class="plan-app-check"><Check /></el-icon>
        <span class="truncate">{{ item.name }}</span>
      </div>
      <div class="pl-24px text-12px text-[var(--el-text-color-secondary)] truncate">
        <span v-if="item.code">{{ item.code }}</span>
        <template v-if="item.status">
          <span v-if="item.code"> · </span>
          <span :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { ConfigurationStatus, ConfigurationStatusExtArray, iamEnumLabel } from "@ingot/admin-common";
import type { PlanAppOption } from "../wizard";

defineOptions({ name: "PlanApplicationList" });

defineProps<{
  items: PlanAppOption[];
}>();

const statusLabel = (status: string): string => iamEnumLabel(ConfigurationStatusExtArray, status, "启用");
const statusClass = (status: string): string =>
  status === ConfigurationStatus.DISABLED
    ? "text-[var(--in-color-warning)]"
    : "text-[var(--in-color-primary)]";
</script>

<style lang="postcss" scoped>
.plan-app-check {
  color: var(--in-color-primary);
}
</style>
