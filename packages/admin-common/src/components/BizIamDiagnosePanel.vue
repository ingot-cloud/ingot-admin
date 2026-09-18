<template>
  <div v-if="decision" class="flex flex-col gap-8px">
    <div>结论：{{ decision.allowed ? "允许" : "拒绝" }}</div>
    <div>说明：{{ decision.message }}</div>
    <div>范围：{{ decision.scopeSummary || "—" }}</div>
  </div>
</template>

<script setup lang="ts">
import type { Decision } from "../models/iam";

defineOptions({ name: "BizIamDiagnosePanel" });

defineProps<{
  decision?: Decision | null;
}>();
</script>
