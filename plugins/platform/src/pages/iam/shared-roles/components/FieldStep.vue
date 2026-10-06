<template>
  <in-loading :loading="false" class="h-full min-h-0 flex flex-col">
    <div class="mb-16px text-[var(--el-text-color-secondary)]">
      已配置 {{ configured }} /
      {{ allRows.length }} 个字段。各操作共用本资源字段权限，执行仍受操作与对象范围限制。
    </div>
    <el-empty
      v-if="!allRows.length"
      description="当前权限没有可配置字段；未接入字段执行能力的资源不提供配置"
    />
    <template v-else>
      <el-input
        v-model="keyword"
        class="mb-16px max-w-360px"
        placeholder="搜索应用、资源或字段"
        clearable
      />
      <div
        class="flex-1 min-h-0 overflow-auto rounded-4px p-16px bg-[var(--in-permission-panel-bg)]"
      >
        <div v-for="row in pageRows" :key="row.key" class="mb-16px">
          <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
            {{ row.application }} / {{ row.resource }}
          </div>
          <div class="flex flex-wrap items-center gap-16px">
            <div class="min-w-200px flex-1">
              {{ row.field.label }}
              <span class="text-12px text-[var(--el-text-color-secondary)]">{{
                row.field.key
              }}</span>
            </div>
            <el-select
              :model-value="row.access.visibility"
              class="w-160px"
              @change="privateVisibility(row, $event)"
            >
              <el-option
                v-for="value in row.field.visibilities"
                :key="value"
                :value="value"
                :label="labels[value]"
              />
            </el-select>
            <el-checkbox
              :model-value="row.access.editable"
              :disabled="!row.field.editable || row.access.visibility !== FieldVisibility.FULL"
              @change="privateEditable(row, Boolean($event))"
              >可编辑</el-checkbox
            >
          </div>
        </div>
      </div>
      <el-pagination
        v-model:current-page="page"
        class="mt-16px"
        :page-size="20"
        :total="filtered.length"
        layout="total, prev, pager, next"
      />
    </template>
  </in-loading>
</template>
<script setup lang="ts">
import { FieldVisibility, type FieldAccess, type FieldCapability } from "@ingot/admin-common";
import { Message } from "@ingot/admin-core";
import type { SelectedGrant } from "../wizard";
defineOptions({ name: "RoleFieldStep" });
const grants = defineModel<SelectedGrant[]>({ required: true });
const keyword = ref("");
const page = ref(1);
const labels = { HIDDEN: "隐藏", MASKED: "脱敏", FULL: "完整可见" };
interface Row {
  key: string;
  resourceId: string;
  application: string;
  resource: string;
  field: FieldCapability;
  access: FieldAccess;
}
const allRows = computed<Row[]>(() =>
  [
    ...new Map(
      grants.value
        .filter((grant) => (grant.fieldCapabilities?.length ?? 0) > 0)
        .map((grant) => [grant.resourceId, grant]),
    ).values(),
  ].flatMap((grant) =>
    (grant.fieldCapabilities ?? []).map((field) => ({
      key: `${grant.resourceId}:${field.key}`,
      resourceId: grant.resourceId,
      application: grant.applicationName,
      resource: grant.resourceName,
      field,
      access: grant.fieldPermissions?.[field.key] ??
        grant.fieldDefaults?.[field.key] ?? { visibility: FieldVisibility.HIDDEN, editable: false },
    })),
  ),
);
const valid = (row: Row) =>
  row.field.visibilities.includes(row.access.visibility) &&
  (!row.access.editable || (row.field.editable && row.access.visibility === FieldVisibility.FULL));
const configured = computed(() => allRows.value.filter(valid).length);
const filtered = computed(() =>
  allRows.value.filter((row) =>
    `${row.application} ${row.resource} ${row.field.label} ${row.field.key}`
      .toLowerCase()
      .includes(keyword.value.trim().toLowerCase()),
  ),
);
const pageRows = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20));
watch(keyword, () => {
  page.value = 1;
});
const update = (row: Row, access: FieldAccess): void => {
  grants.value = grants.value.map((grant) =>
    grant.resourceId === row.resourceId
      ? {
          ...grant,
          fieldPermissions: {
            ...grant.fieldDefaults,
            ...grant.fieldPermissions,
            [row.field.key]: access,
          },
        }
      : grant,
  );
};
const privateVisibility = (row: Row, visibility: FieldVisibility): void =>
  update(row, {
    visibility,
    editable: visibility === FieldVisibility.FULL && row.field.editable && row.access.editable,
  });
const privateEditable = (row: Row, editable: boolean): void =>
  update(row, { ...row.access, editable });
defineExpose({
  validate: () => {
    const invalid = allRows.value.findIndex((row) => !valid(row));
    if (invalid < 0) return true;
    keyword.value = "";
    page.value = Math.floor(invalid / 20) + 1;
    Message.warning("存在未完成或超出资源能力的字段配置，请检查定位字段");
    return false;
  },
});
</script>
