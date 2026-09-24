<template>
  <in-drawer
    v-model="visible"
    size="100%"
    layout="pinned"
    padding="0"
    :show-close="false"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <template #header>
      <div class="flex items-center gap-12px text-14px">
        <button type="button" class="wizard-close" @click="privateAskClose">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20.778 20.778a1 1 0 0 0 0-1.414L13.414 12l7.364-7.364a1 1 0 0 0-1.414-1.414L12 10.586 4.636 3.222a1 1 0 0 0-1.414 1.414L10.586 12l-7.364 7.364a1 1 0 1 0 1.414 1.414L12 13.414l7.364 7.364a1 1 0 0 0 1.414 0Z"
              fill="currentColor"
            />
          </svg>
          关闭
        </button>
        <span class="w-1px h-16px bg-[var(--in-border-color)]" />
        <span>编辑应用开通</span>
      </div>
    </template>
    <div class="flex h-full min-h-0">
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

const privateClose = (): void => {
  visible.value = false;
};

const privateAskClose = (): void => {
  if (!changed.value) {
    privateClose();
    return;
  }
  void confirmUnsavedChanges().then((allowed: boolean) => {
    if (allowed) {
      privateClose();
    }
  });
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

<style lang="postcss" scoped>
.wizard-close {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  color: var(--in-text-color);
  cursor: pointer;
  font-size: 14px;
  transition:
    background-color var(--in-motion-duration) var(--in-motion-ease),
    color var(--in-motion-duration) var(--in-motion-ease);
}

.wizard-close svg {
  font-size: 16px;
}

.wizard-close:hover {
  background: var(--in-bg-color-hover);
  color: var(--in-text-color);
}

.wizard-close:active {
  background: var(--in-bg-color-active);
}
</style>
