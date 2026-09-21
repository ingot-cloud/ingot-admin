<template>
  <div v-if="decision" class="flex flex-col gap-8px">
    <div>结论：{{ decision.allowed ? "允许" : "拒绝" }}</div>
    <div>说明：{{ decision.message }}</div>
    <div>范围：{{ decision.scopeSummary || "—" }}</div>
    <div v-if="decision.sources?.length">
      来源：
      <span v-for="(item, index) in decision.sources" :key="`${item.kind}-${item.id}-${index}`">
        {{ item.label || item.id || item.kind }}
        <span v-if="index < decision.sources.length - 1">、</span>
      </span>
    </div>
    <div v-else class="text-[var(--el-text-color-secondary)]">无可披露来源，不以空来源伪造授权</div>
    <div v-if="decision.fieldAccess && Object.keys(decision.fieldAccess).length">
      字段限制：{{ Object.keys(decision.fieldAccess).join("、") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Decision } from "../models/iam";

defineOptions({ name: "BizIamDiagnosePanel" });

defineProps<{
  decision?: Decision | null;
}>();
</script>
