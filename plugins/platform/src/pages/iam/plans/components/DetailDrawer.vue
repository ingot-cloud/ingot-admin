<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="套餐详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本信息" name="base">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field label="名称" :value="detail.record.name">
          <el-input v-model="draft.name" clearable placeholder="请输入套餐名称" />
        </in-detail-field>
        <in-detail-field label="说明" :value="detail.record.description">
          <el-input
            v-model="draft.description"
            type="textarea"
            :rows="3"
            placeholder="请输入说明"
          />
        </in-detail-field>
        <in-detail-field label="状态">
          <template #view>
            <biz-iam-status-tag :status="detail.record.status" />
          </template>
          <in-select
            v-model="draft.status"
            :options="statusEnum.getOptions()"
            placeholder="请选择状态"
          />
        </in-detail-field>
        <in-detail-field label="包含应用">
          <template #view>
            <div class="flex flex-col gap-12px min-w-0">
              <span>已包含 {{ shownApplications.length }} 个应用</span>
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                套餐变化不自动应用。开通不等于业务授权。
              </div>
              <application-list :items="shownApplications" />
            </div>
          </template>
          <div class="flex flex-col gap-12px min-w-0">
            <div class="flex items-center justify-between gap-12px">
              <span>已包含 {{ shownApplications.length }} 个应用</span>
              <in-button type="primary" link @in-click="privateOpenPicker">配置应用</in-button>
            </div>
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              套餐变化不自动应用。开通不等于业务授权。
            </div>
            <application-list :items="shownApplications" />
          </div>
        </in-detail-field>
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
  <application-picker-dialog
    ref="pickerRef"
    :load-applications="loadTenantApplications"
    @confirm="privateOnPicked"
  />
</template>

<script setup lang="ts">
import { Message, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import {
  BizIamStatusTag,
  ConfigurationStatus,
  useConfigurationStatusEnum,
  type PlanRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { PlatformPlanDetailAPI, PlatformPlanUpdateAPI } from "@/api/iam/catalog";
import { platformPlanQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";
import { loadTenantApplications, toPlanAppOptions, type PlanAppOption } from "../wizard";
import ApplicationList from "./ApplicationList.vue";
import ApplicationPickerDialog from "./ApplicationPickerDialog.vue";

defineOptions({ name: "PlanDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const { editing } = session;
const statusEnum = useConfigurationStatusEnum();
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<PlanRecord>>();
const draft = reactive({
  name: "",
  description: "",
  applications: [] as PlanAppOption[],
  status: ConfigurationStatus.ENABLED,
});
const loadGuard = createLoadGuard();
const pickerRef = ref<{ show: (current: PlanAppOption[]) => void }>();
const shownApplications = computed(() => (editing.value ? draft.applications : toPlanAppOptions(detail.value?.record.applications)));

const applyDraft = (record: PlanRecord): void => {
  draft.name = record.name;
  draft.description = record.description ?? "";
  draft.applications = toPlanAppOptions(record.applications);
  draft.status = record.status;
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  draft.name = "";
  draft.description = "";
  draft.applications = [];
  draft.status = ConfigurationStatus.ENABLED;
  PlatformPlanDetailAPI(id)
    .then((detailRes) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = detailRes.data;
      applyDraft(detailRes.data.record);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
      }
    });
};

const privateCancel = (): void => {
  session.exitEdit();
  if (detail.value) {
    applyDraft(detail.value.record);
  }
};

const privateOpenPicker = (): void => {
  pickerRef.value?.show(draft.applications);
};

const privateOnPicked = (applications: PlanAppOption[]): void => {
  draft.applications = applications;
};

const privateSave = (): void => {
  if (!detail.value) {
    return;
  }
  session.saving.value = true;
  PlatformPlanUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    plan: {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      applicationIds: draft.applications.map((item) => item.id),
      status: draft.status,
    },
  })
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
      Message.success("保存成功，既有租户开通不会自动变化");
      session.exitEdit();
      void queryClient.invalidateQueries({ queryKey: platformPlanQueryKeys.lists() });
      emits("success");
    })
    .finally(() => {
      session.saving.value = false;
    });
};

defineExpose({
  show(row: Row) {
    visible.value = true;
    tab.value = "base";
    session.exitEdit();
    load(row.record.id);
  },
});
</script>
