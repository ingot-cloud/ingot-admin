<template>
  <div class="flex flex-col gap-8px">
    <el-date-picker v-model="fromDate" type="datetime" placeholder="生效时间（本地时间）" />
    <el-date-picker v-model="untilDate" type="datetime" placeholder="失效时间（本地时间）" />
    <div v-if="showMaxDuration" class="flex items-center gap-8px">
      <el-input-number v-model="durationValue" :min="0.001" :precision="3" />
      <el-select v-model="unit" class="w-100px">
        <el-option label="天" value="days" /><el-option label="小时" value="hours" />
      </el-select>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  iamDateInstant,
  iamInstantDate,
  durationHours,
  hoursDuration,
} from "../models/iam/duration";
defineOptions({ name: "BizIamDurationFields" });
defineProps<{ showMaxDuration?: boolean }>();
const validFrom = defineModel<string | undefined>("validFrom");
const validUntil = defineModel<string | undefined>("validUntil");
const maxAssignmentDuration = defineModel<string | undefined>("maxAssignmentDuration");
const unit = ref<"days" | "hours">("days");
const fromDate = computed({
  get: () => iamInstantDate(validFrom.value),
  set: (value: Date | null | undefined) => {
    validFrom.value = iamDateInstant(value);
  },
});
const untilDate = computed({
  get: () => iamInstantDate(validUntil.value),
  set: (value: Date | null | undefined) => {
    validUntil.value = iamDateInstant(value);
  },
});
const durationValue = computed({
  get: () => durationHours(maxAssignmentDuration.value) / (unit.value === "days" ? 24 : 1),
  set: (value: number | undefined) => {
    maxAssignmentDuration.value = value
      ? hoursDuration(value * (unit.value === "days" ? 24 : 1))
      : undefined;
  },
});
</script>
