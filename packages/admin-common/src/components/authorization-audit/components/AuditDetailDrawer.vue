<template>
  <in-drawer v-model="visible" title="授权审计详情" size="min(680px, 100vw)">
    <in-form v-if="entry" :editing="false">
      <el-form-item label="审计 ID"><in-copy-tag :text="entry.id" /></el-form-item>
      <el-form-item label="时间">{{ formatDateTime(entry.timestamp) }}</el-form-item>
      <el-form-item label="操作者">{{ auditActor(entry, references) }}</el-form-item>
      <el-form-item label="操作">{{ auditChange(entry) }}</el-form-item>
      <el-form-item label="目标">{{ auditTarget(entry, references) }}</el-form-item>
      <el-form-item label="角色分配">{{ relationText("assignment", entry.assignmentId) }}</el-form-item>
      <el-form-item label="来源委派">{{ relationText("delegation", entry.delegationId) }}</el-form-item>
      <el-form-item label="追踪 ID">
        <in-copy-tag v-if="entry.traceId" :text="entry.traceId" />
        <span v-else>-</span>
      </el-form-item>
      <el-form-item label="关联版本">
        <div v-if="revisionLines.length" class="flex flex-col gap-4px">
          <span v-for="line in revisionLines" :key="line">{{ line }}</span>
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
import type { AuditEntry, AuditReferences } from "../../../models/iam";
import { AUDIT_RESOURCE_LABELS, auditActor, auditChange, auditTarget } from "../display";
import { auditChangeLines } from "../formatters";
import { referenceText, resolveReference } from "../references";

const CREATED_REVISION_KEYS = new Set(["DIRECTORY", "FIELD", "directory-policy", "field-policy"]);
const visible = defineModel<boolean>({ default: false });
const props = defineProps<{ entry?: AuditEntry; references?: AuditReferences }>();
const differences = computed(() => {
  const entry = props.entry;
  if (!entry) return [];
  return auditChangeLines(entry.before, entry.after, props.references, entry.target.resource, true).map(
    (line) => ({
      label: line.label,
      before: line.before ?? "未记录",
      after: line.after ?? "未记录",
    }),
  );
});
const revisionLines = computed(() => {
  const entry = props.entry;
  if (!entry) return [];
  return Object.entries(entry.revisions).map(([resource, version]) => {
    const label = AUDIT_RESOURCE_LABELS[resource] || resource;
    const text = CREATED_REVISION_KEYS.has(resource) ? "已创建" : version;
    return `${label}：${text}`;
  });
});
const relationText = (type: "assignment" | "delegation", id?: string): string => {
  if (!id) return "-";
  return referenceText(type, resolveReference(props.references, type, id));
};
</script>
