<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="session.editing.value"
    title="套餐详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本信息" name="base">
      <el-form v-if="detail" label-position="top">
        <el-form-item label="名称">
          <el-input v-if="session.editing.value" v-model="draft.name" />
          <span v-else>{{ detail.record.name }}</span>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-if="session.editing.value" v-model="draft.description" type="textarea" :rows="3" />
          <span v-else>{{ detail.record.description || "—" }}</span>
        </el-form-item>
        <el-form-item label="包含应用">
          <biz-iam-chip-page-select
            v-if="session.editing.value"
            v-model="draft.applicationIds"
            empty-text="未绑定应用"
            placeholder="远程分页添加应用"
            :load-data="loadApplications"
            :initial-labels="applicationLabels"
          />
          <div v-else class="flex flex-col gap-4px">
            <div v-for="id in detail.record.applicationIds" :key="id">
              {{ applicationLabels[id] ?? id }}
            </div>
            <div v-if="!detail.record.applicationIds.length">未绑定应用</div>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <biz-iam-status-tag :status="detail.record.status" />
        </el-form-item>
      </el-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, useDetailEditSession } from "@ingot/admin-core";
import {
  BizIamChipPageSelect,
  BizIamStatusTag,
  createIamListLoader,
  toIamSelectRecords,
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
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<PlanRecord>>();
const applicationLabels = reactive<Record<string, string>>({});
const draft = reactive({
  name: "",
  description: "",
  applicationIds: [] as string[],
});

const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await PlatformApplicationPageAPI(page, condition);
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
  loading.value = true;
  PlatformPlanDetailAPI(id)
    .then((detailRes) => {
      detail.value = detailRes.data;
      applyDraft(detailRes.data.record);
      return resolveSelectedLabels(detailRes.data.record.applicationIds);
    })
    .finally(() => {
      loading.value = false;
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
