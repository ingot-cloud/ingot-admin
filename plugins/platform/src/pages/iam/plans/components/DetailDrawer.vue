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
        <in-detail-field label="包含应用">
          <template #view>
            <div class="flex flex-col gap-4px">
              <div v-for="id in detail.record.applicationIds" :key="id">
                {{ applicationLabels[id] ?? id }}
              </div>
              <div v-if="!detail.record.applicationIds.length">未绑定应用</div>
            </div>
          </template>
          <biz-iam-chip-page-select
            v-model="draft.applicationIds"
            empty-text="未绑定应用"
            placeholder="远程分页添加应用"
            :load-data="loadApplications"
            :initial-labels="applicationLabels"
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
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import {
  AuthorizationDomain,
  BizIamChipPageSelect,
  BizIamStatusTag,
  ConfigurationStatus,
  createIamListLoader,
  toIamSelectRecords,
  useConfigurationStatusEnum,
  type PlanRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformApplicationDetailAPI,
  PlatformApplicationPageAPI,
  PlatformPlanDetailAPI,
  PlatformPlanUpdateAPI,
} from "@/api/iam/catalog";
import { platformPlanQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";

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
const applicationLabels = reactive<Record<string, string>>({});
const draft = reactive({
  name: "",
  description: "",
  applicationIds: [] as string[],
  status: ConfigurationStatus.ENABLED,
});
const loadGuard = createLoadGuard();

const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await PlatformApplicationPageAPI(page, {
    ...condition,
    domain: AuthorizationDomain.TENANT,
  });
  const mapped = toIamSelectRecords(response.data);
  for (const item of mapped.records ?? []) {
    applicationLabels[item.id] = item.name;
  }
  return { data: mapped };
});

const applyDraft = (record: PlanRecord): void => {
  draft.name = record.name;
  draft.description = record.description ?? "";
  draft.applicationIds = [...record.applicationIds];
  draft.status = record.status;
};

const resolveSelectedLabels = (ids: string[]): Promise<void> =>
  Promise.all(
    ids.map((id) =>
      applicationLabels[id]
        ? Promise.resolve()
        : PlatformApplicationDetailAPI(id).then((response) => {
            applicationLabels[id] = response.data.record.name;
          }),
    ),
  ).then(() => undefined);

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  draft.name = "";
  draft.description = "";
  draft.applicationIds = [];
  draft.status = ConfigurationStatus.ENABLED;
  PlatformPlanDetailAPI(id)
    .then((detailRes) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = detailRes.data;
      applyDraft(detailRes.data.record);
      return resolveSelectedLabels(detailRes.data.record.applicationIds);
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
      applicationIds: [...draft.applicationIds],
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
