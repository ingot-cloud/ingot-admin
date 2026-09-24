<template>
  <in-drawer
    v-model="visible"
    title="编辑应用开通"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame flex h-full min-h-0">
      <wizard-nav :steps="ENTITLEMENT_WIZARD_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ ENTITLEMENT_WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0 overflow-auto">
          <entitlement-draft-panel
            v-if="panelReady"
            v-show="step === 0"
            ref="panelRef"
            :resolve-union="resolveEditUnion"
          />
          <div v-if="step === 1" class="flex flex-col gap-16px">
            <entitlement-preview :items="previewItems" />
            <biz-iam-preview-alert :preview="preview" />
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < 1" type="primary" :loading="previewing" @in-click="privateNext">下一步</in-button>
      <in-button v-else type="primary" :loading="saving" :disabled="!preview?.valid" @in-click="privateSubmit">
        保存开通
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { confirmUnsavedChanges, Message } from "@ingot/admin-core";
import {
  BizIamPreviewAlert,
  type EntitlementDraft,
  type EntitlementPreviewResult,
  type IamSelectOption,
  type Preview,
} from "@ingot/admin-common";
import {
  PlatformTenantEntitlementsPreviewAPI,
  PlatformTenantEntitlementsReplaceAPI,
} from "@/api/iam/tenants";
import WizardNav from "../../shared-roles/components/WizardNav.vue";
import EntitlementDraftPanel from "./EntitlementDraftPanel.vue";
import EntitlementPreview from "./EntitlementPreview.vue";
import { ENTITLEMENT_WIZARD_STEPS, extraSelectOptionsOf, toPreviewItems, type EntitlementItem } from "../wizard";

defineOptions({ name: "EntitlementEditWizard" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const saving = ref(false);
const previewing = ref(false);
const panelReady = ref(false);
const step = ref(0);
const tenantId = ref("");
const expectedVersion = ref("");
const baseline = ref("");
const preview = ref<Preview<EntitlementPreviewResult> | null>(null);
const previewItems = ref<EntitlementItem[]>([]);
const panelRef = ref<{
  reset: () => void;
  extrasForResolve: () => EntitlementDraft[];
  planId: { value: string };
  extras: { value: IamSelectOption[] };
  load: (input: {
    planId?: string;
    planName?: string;
    extras: IamSelectOption[];
    items?: EntitlementItem[];
  }) => Promise<void>;
}>();

const replacePayload = () => ({
  expectedVersion: expectedVersion.value,
  planId: panelRef.value?.planId.value || undefined,
  entitlements: panelRef.value?.extrasForResolve() ?? [],
});

const changed = computed(() => JSON.stringify(replacePayload()) !== baseline.value);

const resolveEditUnion = async (input: {
  planId?: string;
  extras: EntitlementDraft[];
}): Promise<EntitlementItem[]> => {
  const response = await PlatformTenantEntitlementsPreviewAPI(tenantId.value, {
    expectedVersion: expectedVersion.value,
    planId: input.planId,
    entitlements: input.extras,
  });
  preview.value = response.data;
  previewItems.value = toPreviewItems(response.data.effectiveResult?.entitlements);
  return previewItems.value;
};

const reset = (): void => {
  step.value = 0;
  preview.value = null;
  previewItems.value = [];
  baseline.value = "";
  saving.value = false;
  panelReady.value = false;
};

const privateOnBeforeClose = (done: () => void): void => {
  if (!changed.value) {
    done();
    return;
  }
  void confirmUnsavedChanges().then((allowed: boolean) => {
    if (allowed) {
      done();
    }
  });
};

const privateBack = (): void => {
  step.value = Math.max(0, step.value - 1);
};

const privateNext = (): void => {
  previewing.value = true;
  PlatformTenantEntitlementsPreviewAPI(tenantId.value, replacePayload())
    .then((response) => {
      preview.value = response.data;
      previewItems.value = toPreviewItems(response.data.effectiveResult?.entitlements);
      step.value = 1;
    })
    .finally(() => {
      previewing.value = false;
    });
};

const privateSubmit = (): void => {
  if (!preview.value?.valid) {
    Message.warning("开通预览未通过，不能提交");
    return;
  }
  saving.value = true;
  PlatformTenantEntitlementsReplaceAPI(tenantId.value, replacePayload())
    .then(() => {
      Message.success("开通已更新");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({
  async show(input: {
    tenantId: string;
    version: string;
    planId?: string;
    planName?: string;
    items: EntitlementItem[];
  }) {
    reset();
    tenantId.value = input.tenantId;
    expectedVersion.value = input.version;
    panelReady.value = true;
    visible.value = true;
    await nextTick();
    await panelRef.value?.load({
      planId: input.planId,
      planName: input.planName,
      extras: extraSelectOptionsOf(input.items),
      items: input.items,
    });
    baseline.value = JSON.stringify(replacePayload());
  },
});
</script>
