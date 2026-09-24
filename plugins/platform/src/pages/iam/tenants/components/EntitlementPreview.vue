<template>
  <div class="rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-16px">
    <div v-if="!items.length" class="text-12px text-[var(--el-text-color-secondary)]">暂无开通记录</div>
    <div v-for="item in items" :key="item.applicationId" class="flex flex-col gap-8px">
      <div class="flex items-center gap-8px">
        <el-icon class="entitlement-check"><Check /></el-icon>
        <span>{{ item.applicationName }}</span>
      </div>
      <div class="pl-24px text-12px text-[var(--el-text-color-secondary)]">
        来源 {{ sourceLabel(item.source) }} · {{ formatValidity(item.validFrom, item.validUntil) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { iamEnumLabel, EntitlementSourceExtArray } from "@ingot/admin-common";
import { formatValidity, type EntitlementItem } from "../wizard";

defineOptions({ name: "EntitlementPreview" });

defineProps<{
  items: EntitlementItem[];
}>();

const sourceLabel = (source?: string): string => iamEnumLabel(EntitlementSourceExtArray, source, "手动");
</script>

<style lang="postcss" scoped>
.entitlement-check {
  color: var(--in-color-primary);
}
</style>
