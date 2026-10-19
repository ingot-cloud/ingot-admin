<template>
  <span v-if="departments.length === 0">-</span>
  <span v-else-if="departments.length === 1">{{ departments[0]?.name }}</span>
  <div v-else class="dept-readout">
    <div v-for="(item, index) in departments" :key="item.id" class="dept-readout__item">
      <p class="m-0 flex items-center text-14px leading-20px text-[#1f2329]">
        <span class="pr-4px">{{ index + 1 }}.</span>
        <span>{{ item.name }}</span>
        <span
          v-if="item.primary"
          class="ml-4px inline-flex h-17px items-center rounded-4px bg-[rgba(51,112,255,0.2)] px-4px text-10px font-500 leading-17px text-[#245bdb]"
        >
          主部门
        </span>
      </p>
      <p
        v-if="item.path"
        class="m-0 mt-4px mb-8px text-14px leading-20px text-[#646a73]"
      >
        {{ item.path }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DepartmentDisplay } from "../departmentSelection";

defineOptions({ name: "MemberDepartmentReadout" });

defineProps<{
  departments: DepartmentDisplay[];
}>();
</script>
