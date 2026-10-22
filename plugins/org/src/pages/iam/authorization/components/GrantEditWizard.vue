<template>
  <in-drawer
    v-model="visible"
    title="编辑权限"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="GRANT_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ GRANT_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 0 ? 'overflow-hidden' : 'overflow-auto'">
          <grant-picker
            v-if="step === 0"
            :key="session"
            v-model="grants"
            :catalog-a-p-i="catalogAPI"
            :application-candidates="applicationCandidates"
          />
          <scope-step v-else-if="step === 1" v-model="grants" />
          <biz-iam-role-field-step v-else-if="step === 2" ref="fieldStep" v-model="grants" />
          <div v-else class="flex flex-col gap-16px">
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              保存后关联人员自动生效。
            </div>
            <grant-preview :grants="grants" />
            <biz-iam-preview-alert :preview="currentPreview" />
            <el-alert
              v-if="currentPreview?.effectiveResult"
              type="info"
              :closable="false"
              :title="impactTitle"
            />
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="conflicted" @in-click="privateReloadLock">重读当前配置，保留草稿</in-button>
      <in-button v-if="step > 0" @in-click="step = Math.max(0, step - 1)">上一步</in-button>
      <in-button v-if="step < GRANT_STEPS.length - 1" type="primary" @in-click="privateNext"
        >下一步</in-button
      >
      <in-button
        v-else
        type="primary"
        :loading="saving"
        :disabled="!changed || previewed !== fingerprint"
        @in-click="privateSubmit"
      >
        保存权限，关联人员自动生效
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import {
  isApiError,
  Message,
  confirmUnsavedChanges,
  refreshSessionPermissions,
} from "@ingot/admin-core";
import {
  BizIamPreviewAlert,
  BizIamRoleFieldStep,
  BizIamWizardNav,
  createCurrentRoleApis,
  iamEditorFailure,
  type AuthorizationCandidatesApi,
  type CurrentGrantCatalogAPI,
  type Preview,
  type CurrentRolePreviewResult,
} from "@ingot/admin-common";
import GrantPicker from "./GrantPicker.vue";
import GrantPreview from "./GrantPreview.vue";
import ScopeStep from "./ScopeStep.vue";
import { GRANT_STEPS, grantsFingerprint, toCurrentDefinition, type SelectedGrant } from "../grants";

defineOptions({ name: "GrantEditWizard" });

defineProps<{
  catalogAPI: CurrentGrantCatalogAPI;
  applicationCandidates: AuthorizationCandidatesApi;
}>();

const emits = defineEmits<{ success: [] }>();
const apis = createCurrentRoleApis("tenant");
const fieldStep = ref<InstanceType<typeof BizIamRoleFieldStep>>();
const visible = ref(false);
const saving = ref(false);
const step = ref(0);
const session = ref(0);
const roleId = ref("");
const expectedVersion = ref("");
const grants = ref<SelectedGrant[]>([]);
const baseline = ref("");
const previewed = ref("");
const conflicted = ref(false);
const currentPreview = ref<Preview<CurrentRolePreviewResult>>();
const fingerprint = computed(() => grantsFingerprint(grants.value));
const changed = computed(() => fingerprint.value !== baseline.value);
const impactTitle = computed(() => {
  const result = currentPreview.value?.effectiveResult;
  if (!result) return "";
  return `新增 ${result.addedActionIds.length} 项、移除 ${result.removedActionIds.length} 项、调整范围 ${result.changedScopeActionIds.length} 项；保存后关联人员自动生效`;
});

watch(
  grants,
  () => {
    previewed.value = "";
    currentPreview.value = undefined;
  },
  { deep: true },
);

const privateOnBeforeClose = (done: () => void): void => {
  if (!changed.value) {
    done();
    return;
  }
  void confirmUnsavedChanges().then((allowed) => {
    if (allowed) done();
  });
};

const privateNext = async (): Promise<void> => {
  if (step.value === 0 && !grants.value.length) {
    Message.warning("请至少选择一条权限");
    return;
  }
  if (step.value === 2 && !fieldStep.value?.validate()) return;
  if (step.value === GRANT_STEPS.length - 2) {
    saving.value = true;
    const requestFingerprint = fingerprint.value;
    try {
      const result = await apis.previewAPI(roleId.value, {
        expectedVersion: expectedVersion.value,
        definition: toCurrentDefinition(grants.value),
      });
      if (!visible.value || requestFingerprint !== fingerprint.value) return;
      currentPreview.value = result.data;
      previewed.value = result.data.valid ? requestFingerprint : "";
      conflicted.value = false;
      if (!result.data.valid) {
        Message.warning(result.data.errors?.[0]?.message ?? "预览未通过");
        return;
      }
    } catch (error) {
      void iamEditorFailure(error);
      return;
    } finally {
      saving.value = false;
    }
  }
  step.value = Math.min(GRANT_STEPS.length - 1, step.value + 1);
};

const privateReloadLock = async (): Promise<void> => {
  try {
    const response = await apis.detailAPI(roleId.value);
    expectedVersion.value = response.data.version;
    currentPreview.value = undefined;
    previewed.value = "";
    conflicted.value = false;
    Message.warning("已重读当前配置，草稿已保留，请核对后重新预览");
  } catch (error) {
    void iamEditorFailure(error);
  }
};

const privateSubmit = (): void => {
  if (previewed.value !== fingerprint.value) {
    Message.warning("草稿已变化，请重新预览");
    return;
  }
  if (!changed.value) {
    Message.warning("权限没有变化，无需保存");
    return;
  }
  saving.value = true;
  apis
    .saveAPI(roleId.value, {
      expectedVersion: expectedVersion.value,
      definition: toCurrentDefinition(grants.value),
    })
    .then(async () => {
      await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() =>
        Message.warning("已保存，权限刷新暂不可用，请稍后重试"),
      );
      Message.success("已保存，关联人员自动生效");
      visible.value = false;
      emits("success");
    })
    .catch((error: unknown) => {
      previewed.value = "";
      conflicted.value = isApiError(error) && error.status === 409;
      void iamEditorFailure(error);
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({
  show(input: { roleId: string; version: string; grants: SelectedGrant[] }) {
    session.value += 1;
    roleId.value = input.roleId;
    expectedVersion.value = input.version;
    grants.value = JSON.parse(JSON.stringify(input.grants));
    baseline.value = grantsFingerprint(grants.value);
    step.value = 0;
    previewed.value = "";
    currentPreview.value = undefined;
    conflicted.value = false;
    visible.value = true;
  },
});
</script>
