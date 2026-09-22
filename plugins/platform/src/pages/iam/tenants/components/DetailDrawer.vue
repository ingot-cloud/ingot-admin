<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="组织详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基础信息" name="base">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field label="组织名称" :value="detail.record.name">
          <el-input v-model="draft.name" placeholder="请输入组织名称" />
        </in-detail-field>
        <in-detail-field label="状态">
          <template #view>
            <biz-iam-status-tag :status="detail.record.status" />
          </template>
          <in-select v-model="draft.status" :options="statusEnum.getOptions()" placeholder="请选择状态" />
        </in-detail-field>
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="应用开通" name="apps">
      <div class="flex flex-col gap-12px">
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          套餐变化不自动应用。开通不等于业务授权。
        </div>
        <div
          v-for="item in entitlementDrafts"
          :key="item.applicationId"
          class="flex flex-col gap-8px"
        >
          <div class="flex items-center gap-8px">
            <span class="min-w-160px">{{ nameOf(item.applicationId) }}</span>
            <in-select
              v-if="editing"
              v-model="item.status"
              :options="statusEnum.getOptions()"
              placeholder="请选择开通状态"
            />
            <biz-iam-status-tag v-else :status="item.status" />
            <span class="text-12px">来源 {{ sourceOf(item.applicationId) }}</span>
          </div>
          <div v-if="editing" class="flex gap-8px">
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
          v-if="editing"
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
        <in-button v-if="editing" :loading="previewing" @in-click="privatePreviewEntitlements">
          预览开通影响
        </in-button>
      </div>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="所有者" name="owner" :editable="false">
      <in-form v-if="detail" :editing="false">
        <in-detail-field
          label="所有者"
          :value="detail.record.ownerDisplayName || detail.record.ownerMemberId"
        />
        <in-detail-field label="所有者成员 ID" :value="detail.record.ownerMemberId" />
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import {
  BizIamPreviewAlert,
  BizIamStatusTag,
  ConfigurationStatus,
  collectIamPageRecords,
  createIamListLoader,
  entitlementCollectionVersion,
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
const { editing } = session;
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
const previewing = ref(false);
const loadGuard = createLoadGuard();
const draft = reactive({
  name: "",
  status: ConfigurationStatus.ENABLED,
});

const nameOf = (applicationId: string): string =>
  applicationLabels[applicationId] ??
  entitlements.value.find((item) => item.record.applicationId === applicationId)?.record
    .applicationName ??
  applicationId;

const sourceOf = (applicationId: string): string =>
  entitlements.value.find((item) => item.record.applicationId === applicationId)?.record.source ??
  "MANUAL";

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

const snapshotEntitlements = (
  items: Array<ResourceDetail<EntitlementRecord>>,
): EntitlementDraft[] =>
  items.map((item) => ({
    applicationId: item.record.applicationId,
    status: item.record.status,
    validFrom: item.record.validFrom,
    validUntil: item.record.validUntil,
  }));

const applyEntitlements = (items: Array<ResourceDetail<EntitlementRecord>>): void => {
  entitlements.value = items;
  entitlementDrafts.value = snapshotEntitlements(items);
  entitlementsVersion.value = entitlementCollectionVersion(items);
  for (const item of items) {
    if (item.record.applicationName) {
      applicationLabels[item.record.applicationId] = item.record.applicationName;
    }
  }
};

const privateReset = (): void => {
  detail.value = undefined;
  entitlements.value = [];
  entitlementDrafts.value = [];
  entitlementsVersion.value = "";
  preview.value = null;
  draft.name = "";
  draft.status = ConfigurationStatus.ENABLED;
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  privateReset();
  Promise.all([
    PlatformTenantDetailAPI(id),
    collectIamPageRecords((page) => PlatformTenantEntitlementsAPI(id, page)),
  ])
    .then(([detailRes, items]) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = detailRes.data;
      draft.name = detailRes.data.record.name;
      draft.status = detailRes.data.record.status;
      applyEntitlements(items);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
      }
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

const loadEntitlements = (id: string): Promise<void> =>
  collectIamPageRecords((page) => PlatformTenantEntitlementsAPI(id, page)).then(applyEntitlements);

const privatePreviewEntitlements = (): void => {
  if (!detail.value) {
    return;
  }
  previewing.value = true;
  PlatformTenantEntitlementsPreviewAPI(detail.value.record.id, replacePayload())
    .then((response) => {
      preview.value = response.data;
    })
    .finally(() => {
      previewing.value = false;
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
      .then(() => loadEntitlements(detail.value?.record.id ?? ""))
      .then(() => {
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
