<template>
  <in-drawer
    v-model="visible"
    title="创建组织"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="loading"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame flex h-full min-h-0">
      <wizard-nav :steps="CREATE_WIZARD_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ CREATE_WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0 overflow-auto">
          <in-form v-if="step === 0" class="max-w-560px" label-position="top" :model="draft">
            <el-form-item label="组织头像">
              <in-detail-identity
                :name="draft.name || '新组织'"
                v-model:avatar="draft.avatar"
                editable
                :upload-dir="TENANT_AVATAR_DIR"
              />
            </el-form-item>
            <el-form-item label="组织名称" required>
              <el-input v-model="draft.name" clearable placeholder="请输入组织名称" />
            </el-form-item>
            <el-form-item label="根部门名称">
              <el-input v-model="draft.rootDepartmentName" clearable placeholder="缺省使用组织名称" />
            </el-form-item>
          </in-form>
          <in-form v-else-if="step === 1" class="max-w-560px" label-position="top" :model="draft">
            <el-form-item label="所有者登录名" required>
              <div class="flex gap-8px">
                <el-input v-model="ownerUsername" clearable placeholder="精确查找已有全局账号" />
                <in-button @in-click="privateLookupOwner">查找</in-button>
              </div>
            </el-form-item>
            <el-form-item v-if="draft.ownerAccountId" label="所有者账号 ID">
              <span>{{ draft.ownerAccountId }}</span>
            </el-form-item>
            <el-form-item label="所有者显示名">
              <el-input v-model="draft.ownerDisplayName" clearable placeholder="可空，由服务生成" />
            </el-form-item>
          </in-form>
          <entitlement-draft-panel
            v-if="panelReady"
            v-show="step === 2"
            ref="panelRef"
            :resolve-union="resolveCreateUnion"
          />
          <div v-if="step === 3" class="flex flex-col gap-16px">
            <in-detail-identity :name="previewName" :src="draft.avatar" />
            <biz-iam-preview-alert :preview="preview" />
            <div v-if="preview?.effectiveResult" class="flex flex-col gap-8px">
              <div>组织：{{ preview.effectiveResult.name }}</div>
              <div>所有者账号：{{ preview.effectiveResult.ownerAccountId }}</div>
              <div>根部门：{{ preview.effectiveResult.rootDepartmentName }}</div>
            </div>
            <entitlement-preview :items="previewItems" />
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < 3" type="primary" @in-click="privateNext">下一步</in-button>
      <in-button v-else type="primary" :loading="loading" :disabled="!preview?.valid" @in-click="privateSubmit">
        提交创建
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { confirmUnsavedChanges, Message } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  BizIamPreviewAlert,
  type EntitlementDraft,
  type Preview,
  type TenantCreateInput,
  type TenantPreviewResult,
} from "@ingot/admin-common";
import { PlatformAccountLookupAPI } from "@/api/iam/accounts";
import { PlatformTenantCreateAPI, PlatformTenantPreviewAPI } from "@/api/iam/tenants";
import { platformTenantQueryKeys } from "@/api/iam/tenants.query";
import { useQueryClient } from "@tanstack/vue-query";
import WizardNav from "../../shared-roles/components/WizardNav.vue";
import EntitlementDraftPanel from "./EntitlementDraftPanel.vue";
import EntitlementPreview from "./EntitlementPreview.vue";
import { CREATE_WIZARD_STEPS, TENANT_AVATAR_DIR, toPreviewItems, type EntitlementItem } from "../wizard";

defineOptions({ name: "CreateWizard" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const step = ref(0);
const ownerUsername = ref("");
const preview = ref<Preview<TenantPreviewResult> | null>(null);
const previewItems = ref<EntitlementItem[]>([]);
const panelReady = ref(false);
const panelRef = ref<{
  reset: () => void;
  extrasForResolve: () => EntitlementDraft[];
  planId: { value: string };
  extras: { value: Array<{ id: string }> };
  load: (input: { extras: Array<{ id: string; name: string }> }) => Promise<void>;
}>();
const draft = reactive<TenantCreateInput>({
  name: "",
  ownerAccountId: "",
  ownerDisplayName: "",
  rootDepartmentName: "",
  avatar: "",
  planId: "",
});

const previewName = computed(() => preview.value?.effectiveResult?.name || draft.name || "新组织");

const dirty = computed(
  () =>
    Boolean(
      draft.name ||
        draft.ownerAccountId ||
        draft.ownerDisplayName ||
        draft.rootDepartmentName ||
        draft.avatar ||
        panelRef.value?.planId.value ||
        panelRef.value?.extras.value.length,
    ),
);

const createPayload = (): TenantCreateInput => ({
  name: draft.name.trim(),
  ownerAccountId: draft.ownerAccountId.trim(),
  ownerDisplayName: draft.ownerDisplayName || undefined,
  rootDepartmentName: draft.rootDepartmentName || undefined,
  avatar: draft.avatar || undefined,
  planId: panelRef.value?.planId.value || undefined,
  applications: panelRef.value?.extrasForResolve(),
});

const resolveCreateUnion = async (input: {
  planId?: string;
  extras: EntitlementDraft[];
}): Promise<EntitlementItem[]> => {
  const response = await PlatformTenantPreviewAPI({
    ...createPayload(),
    planId: input.planId,
    applications: input.extras,
  });
  preview.value = response.data;
  previewItems.value = toPreviewItems(response.data.effectiveResult?.entitlements);
  return previewItems.value;
};

const reset = (): void => {
  step.value = 0;
  preview.value = null;
  previewItems.value = [];
  draft.name = "";
  draft.ownerAccountId = "";
  draft.ownerDisplayName = "";
  draft.rootDepartmentName = "";
  draft.avatar = "";
  draft.planId = "";
  ownerUsername.value = "";
  panelReady.value = false;
  panelRef.value?.reset();
};

const privateLookupOwner = (): void => {
  if (!ownerUsername.value.trim()) {
    Message.warning("请输入所有者登录名");
    return;
  }
  loading.value = true;
  PlatformAccountLookupAPI({
    purpose: AccountLookupPurpose.MEMBER_CREATE,
    username: ownerUsername.value.trim(),
  })
    .then((response) => {
      draft.ownerAccountId = response.data.record.id;
      Message.success("已定位账号，不展示其是否属于其他组织");
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateBack = (): void => {
  step.value -= 1;
  preview.value = null;
};

const privateNext = (): void => {
  if (step.value === 0 && !draft.name.trim()) {
    Message.warning("请输入组织名称");
    return;
  }
  if (step.value === 1 && !draft.ownerAccountId.trim()) {
    Message.warning("请先查找所有者账号");
    return;
  }
  if (step.value === 1) {
    panelReady.value = true;
    step.value = 2;
    void nextTick(() => {
      void panelRef.value?.load({ extras: [] });
    });
    return;
  }
  if (step.value === 2) {
    loading.value = true;
    PlatformTenantPreviewAPI(createPayload())
      .then((response) => {
        preview.value = response.data;
        previewItems.value = toPreviewItems(response.data.effectiveResult?.entitlements);
        step.value = 3;
      })
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  step.value += 1;
};

const privateSubmit = (): void => {
  if (!preview.value?.valid) {
    return;
  }
  loading.value = true;
  PlatformTenantCreateAPI(createPayload())
    .then(() => {
      Message.success("创建成功");
      void queryClient.invalidateQueries({ queryKey: platformTenantQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateOnBeforeClose = (done: () => void): void => {
  if (!dirty.value) {
    done();
    return;
  }
  void confirmUnsavedChanges().then((allowed: boolean) => {
    if (allowed) {
      done();
    }
  });
};

defineExpose({
  show() {
    reset();
    visible.value = true;
  },
});
</script>
