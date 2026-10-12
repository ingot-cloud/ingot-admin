<template>
  <in-drawer v-model="visible" title="授权审计详情" size="min(680px, 100vw)">
    <in-form v-if="entry" :editing="false">
      <el-form-item label="审计 ID">{{ entry.id }}</el-form-item>
      <el-form-item label="时间">{{ formatDateTime(entry.timestamp) }}</el-form-item>
      <el-form-item label="操作者"
        >{{ auditActor(entry) }}（成员 ID：{{ entry.actor.memberId }}）</el-form-item
      >
      <el-form-item label="操作">{{ auditChange(entry) }}</el-form-item>
      <el-form-item label="目标">{{ auditTarget(entry) }}</el-form-item>
      <el-form-item label="角色分配">{{ entry.assignmentId || "-" }}</el-form-item>
      <el-form-item label="来源委派">{{ entry.delegationId || "-" }}</el-form-item>
      <el-form-item label="追踪 ID">{{ entry.traceId || "-" }}</el-form-item>
      <el-form-item label="关联版本">
        <div v-if="Object.keys(entry.revisions).length" class="flex flex-col gap-4px">
          <span v-for="(version, resource) in entry.revisions" :key="resource"
            >{{ AUDIT_RESOURCE_LABELS[resource] || resource }}：{{ version }}</span
          >
        </div>
        <span v-else>-</span>
      </el-form-item>
    </in-form>
    <el-table v-if="entry" :data="differences" border class="w-full">
      <el-table-column prop="label" label="变更字段" min-width="120" />
      <el-table-column label="变更前" min-width="190">
        <template #default="{ row }">
          <pre class="whitespace-pre-wrap break-all text-12px">{{ row.before }}</pre>
        </template>
      </el-table-column>
      <el-table-column label="变更后" min-width="190">
        <template #default="{ row }">
          <pre class="whitespace-pre-wrap break-all text-12px">{{ row.after }}</pre>
        </template>
      </el-table-column>
      <template #empty>无配置差异</template>
    </el-table>
  </in-drawer>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { ElTable, ElTableColumn } from "element-plus";
import "element-plus/theme-chalk/el-table.css";
import { formatDateTime } from "@ingot/shared";
import type { AuditEntry } from "../../../models/iam";
import {
  AUDIT_FIELD_LABELS,
  AUDIT_RESOURCE_LABELS,
  auditActor,
  auditChange,
  auditTarget,
  auditValue,
} from "../display";
const visible = defineModel<boolean>({ default: false });
const props = defineProps<{ entry?: AuditEntry }>();
const differences = computed(() => {
  const entry = props.entry;
  if (!entry) return [];
  return [...new Set([...Object.keys(entry.before), ...Object.keys(entry.after)])].map((key) => ({
    label: AUDIT_FIELD_LABELS[key] || key,
    before: auditValue(entry.before[key]),
    after: auditValue(entry.after[key]),
  }));
});
</script>
