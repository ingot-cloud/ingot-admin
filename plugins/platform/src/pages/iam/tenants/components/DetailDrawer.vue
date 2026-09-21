<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="session.editing.value"
    title="组织详情"
    :loading="loading"
    :saving="session.saving.value"
    size="680px"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基础信息" name="base">
      <el-form v-if="detail" label-position="top">
        <el-form-item label="组织名称">
          <el-input v-if="session.editing.value" v-model="draft.name" />
          <span v-else>{{ detail.record.name }}</span>
        </el-form-item>
        <el-form-item label="状态">
          <in-select
            v-if="session.editing.value"
            v-model="draft.status"
            :options="statusEnum.getOptions()"
          />
          <biz-iam-status-tag v-else :status="detail.record.status" />
        </el-form-item>
      </el-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="应用开通" name="apps">
      <div class="flex flex-col gap-12px">
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          套餐变化不自动应用。开通不等于业务授权。
        </div>
        <div v-for="item in entitlementDrafts" :key="item.applicationId" class="flex flex-col gap-8px">
          <div class="flex items-center gap-8px">
            <span class="min-w-160px">{{ nameOf(item.applicationId) }}</span>
            <in-select
              v-if="session.editing.value"
              v-model="item.status"
              :options="statusEnum.getOptions()"
            />
            <biz-iam-status-tag v-else :status="item.status" />
            <span class="text-12px">来源 {{ sourceOf(item.applicationId) }}</span>
          </div>
          <div v-if="session.editing.value" class="flex gap-8px">
            <el-date-picker
              v-model="item.validFrom"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              placeholder="开始（含）"
            />
            <el-date-picker
              v-model="item.validUntil"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              placeholder="结束（不含）"
            />
          </div>
          <div v-else class="text-12px">
            {{ item.validFrom || "不限开始" }} → {{ item.validUntil || "不限结束" }}
          </div>
        </div>
        <div v-if="!entitlementDrafts.length">暂无开通记录</div>
        <in-page-select
          v-if="session.editing.value"
          v-model="addingAppId"
          filterable
          remote
          clearable
          value-field="id"
          label-field="name"
          placeholder="远程分页追加应用开通"
          :load-data="loadApplications"
          @change="privateAddEntitlement"
        />
        <biz-iam-preview-alert v-if="preview" :preview="preview" />
        <in-button v-if="session.editing.value" @click="privatePreviewEntitlements">预览开通影响</in-button>
      </div>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="所有者" name="owner">
      <el-form v-if="detail" label-position="top">
        <el-form-item label="所有者成员 ID">
          <span>{{ detail.record.ownerMemberId }}</span>
        </el-form-item>
      </el-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, useDetailEditSession } from "@ingot/admin-core";
import {
  BizIamPreviewAlert,
  BizIamStatusTag,
  ConfigurationStatus,
  createIamListLoader,
  toIamSelectRecords,
  useConfigurationStatusEnum,
  type EntitlementDraft,
  type EntitlementPreviewResult,
  type EntitlementRecord,
  type Preview,
  type ResourceDetail,
  type TenantRecord,
} from "@ingot/admin-common";
import {
  PlatformTenantDetailAPI,
  PlatformTenantEntitlementsAPI,
  PlatformTenantEntitlementsPreviewAPI,
  PlatformTenantEntitlementsReplaceAPI,
  PlatformTenantUpdateAPI,
} from "@/api/iam/tenants";
import { PlatformApplicationPageAPI } from "@/api/iam/catalog";
import { platformTenantQueryKeys } from "@/api/iam/tenants.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { TenantRow } from "../table";

defineOptions({ name: "TenantDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const statusEnum = useConfigurationStatusEnum();
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<TenantRecord>>();
const entitlements = ref<Array<ResourceDetail<EntitlementRecord>>>([]);
const entitlementDrafts = ref<EntitlementDraft[]>([]);
const entitlementsVersion = ref("");
const applicationLabels = reactive<Record<string, string>>({});
const addingAppId = ref("");
const preview = ref<Preview<EntitlementPreviewResult> | null>(null);
const draft = reactive({
  name: "",
  status: ConfigurationStatus.ENABLED,
});

const nameOf = (applicationId: string): string =>
  applicationLabels[applicationId] ??
  entitlements.value.find((item) => item.record.applicationId === applicationId)?.record.applicationName ??
  applicationId;

const sourceOf = (applicationId: string): string =>
  entitlements.value.find((item) => item.record.applicationId === applicationId)?.record.source ?? "MANUAL";

const loadApplications = createIamListLoader(async (page, condition) => {
  const response = await PlatformApplicationPageAPI(page, condition);
  const mapped = toIamSelectRecords(response.data);
  for (const item of mapped.records ?? []) {
    applicationLabels[item.id] = item.name;
  }
  return { data: mapped };
});

watch(
  entitlementDrafts,
  () => {
    preview.value = null;
  },
  { deep: true },
);

const snapshotEntitlements = (items: Array<ResourceDetail<EntitlementRecord>>): EntitlementDraft[] =>
  items.map((item) => ({
    applicationId: item.record.applicationId,
    status: item.record.status,
    validFrom: item.record.validFrom,
    validUntil: item.record.validUntil,
  }));

const load = (id: string): void => {
  loading.value = true;
  preview.value = null;
  Promise.all([
    PlatformTenantDetailAPI(id),
    PlatformTenantEntitlementsAPI(id),
  ])
    .then(([detailRes, entitlementRes]) => {
      detail.value = detailRes.data;
      entitlements.value = entitlementRes.data ?? [];
      entitlementDrafts.value = snapshotEntitlements(entitlements.value);
      entitlementsVersion.value = entitlements.value[0]?.version || detailRes.data.version;
      for (const item of entitlements.value) {
        if (item.record.applicationName) {
          applicationLabels[item.record.applicationId] = item.record.applicationName;
        }
      }
      draft.name = detailRes.data.record.name;
      draft.status = detailRes.data.record.status;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateCancel = (): void => {
  session.exitEdit();
  preview.value = null;
  if (detail.value) {
    draft.name = detail.value.record.name;
    draft.status = detail.value.record.status;
  }
  entitlementDrafts.value = snapshotEntitlements(entitlements.value);
};

const privateAddEntitlement = (applicationId: string | number | boolean | null): void => {
  const id = typeof applicationId === "string" ? applicationId : "";
  addingAppId.value = "";
  if (!id || entitlementDrafts.value.some((item) => item.applicationId === id)) {
    return;
  }
  entitlementDrafts.value.push({
    applicationId: id,
    status: ConfigurationStatus.ENABLED,
  });
  preview.value = null;
};

const replacePayload = () => ({
  expectedVersion: entitlementsVersion.value,
  entitlements: entitlementDrafts.value.map((item) => ({
    applicationId: item.applicationId,
    status: item.status,
    validFrom: item.validFrom || undefined,
    validUntil: item.validUntil || undefined,
  })),
});

const privatePreviewEntitlements = (): void => {
  if (!detail.value) {
    return;
  }
  loading.value = true;
  PlatformTenantEntitlementsPreviewAPI(detail.value.record.id, replacePayload())
    .then((response) => {
      preview.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateSave = (): void => {
  if (!detail.value) {
    return;
  }
  if (tab.value === "apps") {
    if (preview.value && !preview.value.valid) {
      Message.warning("开通预览未通过，不能提交");
      return;
    }
    session.saving.value = true;
    PlatformTenantEntitlementsReplaceAPI(detail.value.record.id, replacePayload())
      .then((response) => {
        entitlements.value = response.data ?? [];
        entitlementDrafts.value = snapshotEntitlements(entitlements.value);
        entitlementsVersion.value = entitlements.value[0]?.version || entitlementsVersion.value;
        Message.success("开通已更新");
        session.exitEdit();
        preview.value = null;
        emits("success");
      })
      .finally(() => {
        session.saving.value = false;
      });
    return;
  }
  session.saving.value = true;
  PlatformTenantUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    name: draft.name,
    status: draft.status,
  })
    .then((response) => {
      detail.value = response.data;
      Message.success("保存成功");
      session.exitEdit();
      void queryClient.invalidateQueries({ queryKey: platformTenantQueryKeys.lists() });
      emits("success");
    })
    .finally(() => {
      session.saving.value = false;
    });
};

defineExpose({
  show(row: TenantRow) {
    visible.value = true;
    tab.value = "base";
    session.exitEdit();
    load(row.record.id);
  },
});
</script>
