<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="组织详情"
    edit-label="编辑基本信息"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <template #identity>
      <in-detail-identity
        :name="identityName"
        :src="identityAvatar"
        v-model:avatar="draft.avatar"
        :editable="editing"
        :upload-dir="TENANT_AVATAR_DIR"
      >
        <template #status>
          <biz-iam-status-tag v-if="detail" :status="detail.record.status" />
        </template>
      </in-detail-identity>
    </template>

    <in-biz-tab-panel title="基础信息" name="base">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field label="组织名称" :value="detail.record.name">
          <el-input v-model="draft.name" placeholder="请输入组织名称" />
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
        <in-detail-field label="创建时间" :value="formatDateTime(detail.record.createdAt)" />
        <in-detail-field label="所有者成员 ID" :value="detail.record.ownerMemberId" />
        <in-detail-field label="所有者" :value="detail.record.ownerDisplayName || '-'" />
        <in-detail-field label="所有者手机号" :value="detail.record.ownerPhone || '-'" />
        <in-detail-field label="所有者邮箱" :value="detail.record.ownerEmail || '-'" />
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="应用开通" name="apps" :editable="false">
      <div class="flex flex-col gap-12px">
        <div class="flex items-center justify-between">
          <div>已开通 {{ entitlementsLoading ? "—" : entitlementItems.length }} 个应用</div>
          <in-button
            v-auth="IamAction.PLATFORM_ENTITLEMENT_UPDATE"
            :disabled="!canEditEntitlements"
            @in-click="privateEditEntitlements"
          >
            编辑
          </in-button>
        </div>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          套餐变化不自动应用。开通不等于业务授权。
        </div>
        <div v-loading="entitlementsLoading" class="min-h-120px">
          <entitlement-preview v-show="!entitlementsLoading" :items="entitlementItems" />
        </div>
      </div>
    </in-biz-tab-panel>
  </in-detail-drawer>
  <entitlement-edit-wizard ref="entitlementWizardRef" @success="privateOnEntitlementsSaved" />
</template>

<script setup lang="ts">
import { Message, createLoadGuard, useDetailEditSession, type LoadGuard } from "@ingot/admin-core";
import {
  BizIamStatusTag,
  ConfigurationStatus,
  IamAction,
  collectIamPageRecords,
  entitlementCollectionVersion,
  useConfigurationStatusEnum,
  type EntitlementRecord,
  type ResourceDetail,
  type TenantRecord,
} from "@ingot/admin-common";
import { PlatformPlanDetailAPI } from "@/api/iam/catalog";
import {
  PlatformTenantDetailAPI,
  PlatformTenantEntitlementsAPI,
  PlatformTenantUpdateAPI,
} from "@/api/iam/tenants";
import { platformTenantQueryKeys } from "@/api/iam/tenants.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { TenantRow } from "../table";
import EntitlementEditWizard from "./EntitlementEditWizard.vue";
import EntitlementPreview from "./EntitlementPreview.vue";
import {
  TENANT_AVATAR_DIR,
  formatDateTime,
  toEntitlementItems,
  type EntitlementItem,
} from "../wizard";

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
const entitlementsVersion = ref("");
const loadGuard = createLoadGuard();
const inactiveGuard: LoadGuard = { isCurrent: () => false };
let activeGuard: LoadGuard = inactiveGuard;
const entitlementsReady = ref(false);
const entitlementsLoading = ref(false);
const entitlementWizardRef = ref<{
  show: (input: {
    tenantId: string;
    version: string;
    planId?: string;
    planName?: string;
    items: EntitlementItem[];
  }) => void;
}>();
const planName = ref("");
const draft = reactive({
  name: "",
  avatar: undefined as string | undefined,
  status: ConfigurationStatus.ENABLED,
});

const identityName = computed(() => draft.name || detail.value?.record.name || "组织");
const identityAvatar = computed(() => draft.avatar || detail.value?.record.avatar);
const entitlementItems = computed(() =>
  toEntitlementItems(
    entitlements.value.map((item: ResourceDetail<EntitlementRecord>) => item.record),
  ),
);
const canEditEntitlements = computed(
  () => !entitlementsLoading.value && Boolean(entitlementsVersion.value),
);

const applyDetail = (item: ResourceDetail<TenantRecord>): void => {
  detail.value = item;
  draft.name = item.record.name;
  draft.avatar = item.record.avatar;
  draft.status = item.record.status;
};

const applyEntitlements = (items: Array<ResourceDetail<EntitlementRecord>>): void => {
  entitlements.value = items;
  entitlementsVersion.value = entitlementCollectionVersion(items);
};

const privateReset = (): void => {
  detail.value = undefined;
  entitlements.value = [];
  entitlementsVersion.value = "";
  entitlementsReady.value = false;
  entitlementsLoading.value = false;
  planName.value = "";
  draft.name = "";
  draft.avatar = undefined;
  draft.status = ConfigurationStatus.ENABLED;
};

const loadPlanName = (planId: string | undefined, guard = activeGuard): void => {
  if (!planId) {
    planName.value = "";
    return;
  }
  PlatformPlanDetailAPI(planId).then((response) => {
    if (guard.isCurrent()) {
      planName.value = response.data.record.name;
    }
  });
};

const loadEntitlements = (id: string, guard = activeGuard): void => {
  entitlementsReady.value = true;
  entitlementsLoading.value = true;
  collectIamPageRecords((page: { current?: number; size?: number }) =>
    PlatformTenantEntitlementsAPI(id, page),
  )
    .then((items) => {
      if (!guard.isCurrent()) {
        return;
      }
      applyEntitlements(items);
      loadPlanName(detail.value?.record.planId, guard);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        entitlementsLoading.value = false;
      }
    });
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  activeGuard = guard;
  loading.value = true;
  privateReset();
  PlatformTenantDetailAPI(id)
    .then((detailRes) => {
      if (!guard.isCurrent()) {
        return;
      }
      applyDetail(detailRes.data);
      if (tab.value === "apps") {
        loadEntitlements(id, guard);
      }
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
      }
    });
};

watch(tab, (name) => {
  const id = detail.value?.record.id;
  if (name === "apps" && id && !entitlementsReady.value) {
    loadEntitlements(id);
  }
});

const privateCancel = (): void => {
  session.exitEdit();
  if (detail.value) {
    applyDetail(detail.value);
  }
};

const privateSave = (): void => {
  if (!detail.value) {
    return;
  }
  session.saving.value = true;
  PlatformTenantUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    name: draft.name,
    avatar: draft.avatar,
    status: draft.status,
  })
    .then((response) => {
      applyDetail(response.data);
      Message.success("保存成功");
      session.exitEdit();
      void queryClient.invalidateQueries({ queryKey: platformTenantQueryKeys.lists() });
      emits("success");
    })
    .finally(() => {
      session.saving.value = false;
    });
};

const privateEditEntitlements = (): void => {
  if (!detail.value || !canEditEntitlements.value) {
    return;
  }
  entitlementWizardRef.value?.show({
    tenantId: detail.value.record.id,
    version: entitlementsVersion.value,
    planId: detail.value.record.planId,
    planName: planName.value,
    items: entitlementItems.value,
  });
};

const privateOnEntitlementsSaved = (): void => {
  if (!detail.value) {
    return;
  }
  const id = detail.value.record.id;
  PlatformTenantDetailAPI(id).then((detailRes) => {
    applyDetail(detailRes.data);
    loadEntitlements(id);
  });
  emits("success");
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
