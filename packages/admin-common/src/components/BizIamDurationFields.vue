<template>
  <div class="flex flex-col gap-8px">
    <el-date-picker
      v-model="validFrom"
      type="datetime"
      placeholder="生效时间"
      value-format="YYYY-MM-DDTHH:mm:ss[Z]"
    />
    <el-date-picker
      v-model="validUntil"
      type="datetime"
      placeholder="失效时间"
      value-format="YYYY-MM-DDTHH:mm:ss[Z]"
    />
    <el-input
      v-if="showMaxDuration"
      v-model="maxAssignmentDuration"
      placeholder="最长授权期限，如 P30D"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "BizIamDurationFields" });

defineProps<{
  showMaxDuration?: boolean;
}>();

const validFrom = defineModel<string | undefined>("validFrom");
const validUntil = defineModel<string | undefined>("validUntil");
const maxAssignmentDuration = defineModel<string | undefined>("maxAssignmentDuration");
</script>
