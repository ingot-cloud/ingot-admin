<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header
        :title="title"
        description="查看当前管理范围内的授权变更、配置差异与关联记录。"
      />
    </template>
    <in-split-layout>
      <in-table
        :loading="paging.fetching.value"
        :data="records"
        :headers="visibleHeaders"
        :table-id="TABLE_ID"
        :feedback="feedback"
        density="compact"
        :row-key="rowKeyOf"
      >
        <template v-if="canRead" #tools-start>
          <div class="w-220px">
            <biz-tenant-member-select
              v-if="domain === AuthorizationDomain.TENANT"
              :model-value="paging.condition.actorMemberId || ''"
              closable
              placeholder="请选择操作者"
              title="选择操作者"
              :load-members="loadActorMembers"
              @update:model-value="privateSetActor"
            />
            <template v-else>
              <in-selection-field
                :items="actorItems"
                closable
                placeholder="请选择操作者"
                @click="privateOpenActor"
                @remove="privateClearActor"
              />
              <biz-iam-member-picker-dialog
                ref="actorPicker"
                title="选择操作者"
                search-placeholder="请输入姓名"
                :load-members="loadActorMembers"
                @confirm="privateConfirmActor"
              />
            </template>
          </div>
          <el-tag v-if="lockedLabel" closable @close="emit('clear-target')">{{
            lockedLabel
          }}</el-tag>
          <in-filter-panel :active-count="extraFilterCount" :width="FILTER_PANEL_WIDTH">
            <in-picker v-model="changeFilter" label="变更类型" :options="changeOptions" />
            <in-picker
              v-if="!locked"
              v-model="targetTypeFilter"
              label="对象类型"
              :options="targetOptions"
            />
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              class="w-full!"
              clearable
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              range-separator="至"
            />
            <span class="text-12px text-[var(--in-text-color-secondary)]"
              >包含开始时间，不包含结束时间</span
            >
            <template #footer><in-button @click="resetExtraFilters">重置</in-button></template>
          </in-filter-panel>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #timestamp="{ item }">{{ formatDateTime(item.record.timestamp) }}</template>
        <template #actor="{ item }">{{ auditActor(item.record, references) }}</template>
        <template #changeType="{ item }">
          <biz-iam-record-link
            v-if="action"
            :action="action"
            :capabilities="item.capabilities"
            @click="openDetail(item)"
          >
            {{ auditChange(item.record) }}
          </biz-iam-record-link>
        </template>
        <template #target="{ item }">{{ auditTarget(item.record, references) }}</template>
        <template #changeSummary="{ item }">
          <el-tooltip placement="top" :show-after="400">
            <template #content>
              <div class="max-w-420px whitespace-pre-line">
                {{ auditSummaryLines(item.record, references) }}
              </div>
            </template>
            <span class="line-clamp-2">{{ auditSummary(item.record, references) }}</span>
          </el-tooltip>
        </template>
        <template #error>
          <el-empty description="暂时无法加载授权审计">
            <in-button v-if="canRead" @click="paging.search">重试</in-button>
          </el-empty>
        </template>
        <template #unauthorized><el-empty description="没有查看当前域授权审计的权限" /></template>
        <template v-if="showPager" #pagination>
          <in-cursor-pager
            :page="paging.page.value"
            :size="paging.size.value"
            :has-prev="paging.hasPrev.value"
            :has-next="paging.hasNext.value"
            :disabled="paging.fetching.value"
            :page-sizes="AUDIT_PAGE_SIZES"
            @prev="paging.prev"
            @next="paging.next"
            @size-change="paging.changeSize"
          />
        </template>
      </in-table>
    </in-split-layout>
    <AuditDetailDrawer v-model="detailVisible" :entry="detail?.record" :references="references" />
  </in-page-frame>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { formatDateTime } from "@ingot/shared";
import { applyColumnSelection, withAllPickerOption } from "@ingot/admin-core";
import {
  AuthorizationDomain,
  useAuditChangeTypeEnum,
  type AuditEntry,
  type IamSelectOption,
  type ResourceDetail,
} from "../../models/iam";
import { tableHeaders } from "./table";
import { useOps, type AuditOptions } from "./useOps";
import {
  AUDIT_RESOURCE_LABELS,
  PLATFORM_AUDIT_TARGETS,
  TENANT_AUDIT_TARGETS,
  auditActor,
  auditChange,
  auditSummary,
  auditSummaryLines,
  auditTarget,
} from "./display";
import { referenceKey, referenceText, referenceTypeOfTarget } from "./references";
import AuditDetailDrawer from "./components/AuditDetailDrawer.vue";
import BizIamRecordLink from "../BizIamRecordLink.vue";
import BizTenantMemberSelect from "../BizTenantMemberSelect.vue";
import BizIamMemberPickerDialog from "../BizIamMemberPickerDialog.vue";

const AUDIT_PAGE_SIZES = [20, 50, 100];
/** 时间范围需要比默认 320px 更宽，避免筛选浮层出现横向滚动。 */
const FILTER_PANEL_WIDTH = 480;
const props = defineProps<AuditOptions>();
const emit = defineEmits<{ "clear-target": [] }>();
const TABLE_ID = `iam-${props.domain.toLowerCase()}-authorization-audit`;
const {
  paging,
  records,
  references,
  title,
  feedback,
  canRead,
  action,
  changeFilter,
  targetTypeFilter,
  timeRange,
  extraFilterCount,
  resetExtraFilters,
  setActor,
  locked,
  detail,
  detailVisible,
  openDetail,
} = useOps(props);
const changeEnum = useAuditChangeTypeEnum();
const changeOptions = computed(() => withAllPickerOption(changeEnum.getOptions()));
const targetOptions = computed(() =>
  withAllPickerOption(
    (props.domain === AuthorizationDomain.TENANT
      ? TENANT_AUDIT_TARGETS
      : PLATFORM_AUDIT_TARGETS
    ).map((value) => ({ value, label: AUDIT_RESOURCE_LABELS[value] || value })),
  ),
);
const actorName = ref("");
const actorItems = computed<IamSelectOption[]>(() => {
  const id = paging.condition.actorMemberId;
  return id ? [{ id, name: actorName.value || "已选成员" }] : [];
});
const showPager = computed(
  () =>
    canRead.value &&
    feedback.value !== "error" &&
    feedback.value !== "unauthorized" &&
    (records.value.length > 0 || paging.hasPrev.value || paging.hasNext.value),
);
const actorPicker = ref<{ show: (current?: IamSelectOption[]) => void }>();
const lockedLabel = computed(() => {
  const target = locked.value;
  if (!target) return "";
  const typeLabel = AUDIT_RESOURCE_LABELS[target.type] || target.type;
  const refType = referenceTypeOfTarget(target.type);
  const found = refType ? references.value[referenceKey(refType, target.id)] : undefined;
  return found
    ? `已限定对象：${typeLabel} · ${referenceText(refType || target.type, found)}`
    : `已限定对象：${typeLabel}`;
});
const selectedColumns = ref<string[]>([]);
const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumns.value));
const privateOnColumnChange = (columns: string[]): void => {
  selectedColumns.value = columns;
};
const privateSetActor = (value: string | string[]): void => {
  const id = Array.isArray(value) ? value[0] : value;
  setActor(id || undefined);
};
const privateOpenActor = (): void => {
  actorPicker.value?.show(actorItems.value);
};
const privateConfirmActor = (members: IamSelectOption[]): void => {
  const member = members[0];
  actorName.value = member?.name || "";
  setActor(member?.id);
};
const privateClearActor = (): void => {
  actorName.value = "";
  setActor(undefined);
};
const rowKeyOf = (row: ResourceDetail<AuditEntry>): string => row.record.id;
</script>
