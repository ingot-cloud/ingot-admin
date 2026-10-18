<template>
  <in-drawer
    v-model="visible"
    :title="title"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame flex h-full min-h-0">
      <wizard-nav :steps="steps" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ steps[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 1 ? 'overflow-hidden' : 'overflow-auto'">
          <in-form v-if="step === 0" class="max-w-560px">
            <el-form-item label="编码" required>
              <el-input
                v-model="profile.code"
                :placeholder="platform ? '发布后不可改' : '创建后不可改'"
              />
            </el-form-item>
            <el-form-item label="名称" required>
              <el-input v-model="profile.name" placeholder="请输入角色名称" />
            </el-form-item>
            <el-form-item label="说明">
              <el-input
                v-model="profile.description"
                type="textarea"
                :rows="3"
                placeholder="请输入说明"
              />
            </el-form-item>
            <el-form-item label="分组">
              <el-input v-model="profile.groupName" placeholder="请输入分组，可空" />
            </el-form-item>
          </in-form>
          <grant-picker
            v-else-if="step === 1"
            v-model="grants"
            :domain="grantDomain"
            :current="!platform"
          />
          <scope-step
            v-else-if="step === 2"
            v-model="grants"
            :domain="grantDomain"
            :current="!platform"
          />
          <field-step v-else-if="platform && step === 3" ref="fieldStep" v-model="grants" />
          <div v-else>
            <preview-panel
              :profile="profile"
              :grants="grants"
              v-bind="platform ? {} : { hint: '保存后关联组织立即生效。' }"
            />
            <biz-iam-role-version-form
              v-if="platform"
              v-model:name="versionName"
              v-model:remark="versionRemark"
              class="mt-24px max-w-640px"
            />
            <div v-if="!platform" class="mt-24px flex flex-col gap-12px">
              <biz-iam-preview-alert :preview="currentPreview" />
              <el-alert
                v-if="currentPreview?.effectiveResult"
                type="info"
                :closable="false"
                :title="currentImpactTitle"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < steps.length - 1" type="primary" @in-click="privateNext"
        >下一步</in-button
      >
      <in-button
        v-else
        type="primary"
        :disabled="previewed !== fingerprint"
        :loading="saving"
        @in-click="privateSubmit"
      >
        {{ platform ? "创建并发布首个版本" : "创建角色" }}
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import {
  confirmUnsavedChanges,
  Message,
  refreshSessionPermissions,
  type R,
} from "@ingot/admin-core";
import {
  AuthorizationDomain,
  BizIamPreviewAlert,
  BizIamRoleVersionForm,
  createCurrentRoleApis,
  RoleKind,
  type CreatedResource,
  type CurrentRolePreviewResult,
  type Preview,
  iamEditorFailure,
  type RoleCreateInput,
  type RoleCreateKind,
} from "@ingot/admin-common";
import { PlatformRoleCreatePreviewAPI } from "@/api/iam/authorization";
import FieldStep from "./FieldStep.vue";
import GrantPicker from "./GrantPicker.vue";
import PreviewPanel from "./PreviewPanel.vue";
import ScopeStep from "./ScopeStep.vue";
import WizardNav from "./WizardNav.vue";
import {
  emptyWizardProfile,
  grantsFingerprint,
  profileDirty,
  toCreateInput,
  toCurrentCreateInput,
  WIZARD_STEPS,
  PLATFORM_WIZARD_STEPS,
  type SelectedGrant,
} from "../wizard";

defineOptions({ name: "CreateWizard" });

const props = withDefaults(
  defineProps<{
    title?: string;
    kind?: RoleCreateKind;
    createApi?: (input: RoleCreateInput) => Promise<R<CreatedResource>>;
  }>(),
  {
    title: "创建共享角色",
    kind: RoleKind.SHARED,
  },
);

const emits = defineEmits<{ success: [] }>();
const currentApis = createCurrentRoleApis("shared");
const grantDomain = computed(() =>
  props.kind === RoleKind.PLATFORM_CUSTOM
    ? AuthorizationDomain.PLATFORM
    : AuthorizationDomain.TENANT,
);
const platform = computed(() => props.kind === RoleKind.PLATFORM_CUSTOM);
const steps = computed(() => (platform.value ? PLATFORM_WIZARD_STEPS : WIZARD_STEPS));
const fieldStep = ref<InstanceType<typeof FieldStep>>();
const previewed = ref("");
const previewSession = ref(0);
const currentPreview = ref<Preview<CurrentRolePreviewResult>>();
const versionName = ref(""),
  versionRemark = ref("");
const visible = ref(false);
const saving = ref(false);
const step = ref(0);
const profile = reactive(emptyWizardProfile());
const grants = ref<SelectedGrant[]>([]);
const currentImpactTitle = computed(() => {
  const result = currentPreview.value?.effectiveResult;
  if (!result) return "";
  return `新增 ${result.addedActionIds.length} 项、移除 ${result.removedActionIds.length} 项、调整范围 ${result.changedScopeActionIds.length} 项；保存后关联组织立即生效`;
});

const dirty = computed(() => profileDirty(profile) || grants.value.length > 0);

const reset = (): void => {
  versionName.value = "";
  versionRemark.value = "";
  previewSession.value += 1;
  step.value = 0;
  Object.assign(profile, emptyWizardProfile());
  grants.value = [];
  saving.value = false;
  previewed.value = "";
  currentPreview.value = undefined;
};

const privateOnBeforeClose = (done: () => void): void => {
  if (!dirty.value) {
    done();
    return;
  }
  void confirmUnsavedChanges().then((allowed) => {
    if (allowed) {
      done();
    }
  });
};

const privateBack = (): void => {
  step.value = Math.max(0, step.value - 1);
};

const privateNext = async (): Promise<void> => {
  if (step.value === 0 && (!profile.code.trim() || !profile.name.trim())) {
    Message.warning("请填写编码和名称");
    return;
  }
  if (step.value === 1 && !grants.value.length) {
    Message.warning("请至少选择一条操作");
    return;
  }
  if (platform.value && step.value === 3 && !fieldStep.value?.validate()) return;
  if (step.value === steps.value.length - 2) {
    saving.value = true;
    const requestFingerprint = fingerprint.value;
    const requestSession = previewSession.value;
    try {
      if (platform.value) {
        const result = await PlatformRoleCreatePreviewAPI(
          toCreateInput(profile, grants.value, props.kind),
        );
        if (
          !visible.value ||
          requestSession !== previewSession.value ||
          requestFingerprint !== fingerprint.value
        )
          return;
        if (!result.data.valid) {
          Message.warning(result.data.errors?.[0]?.message ?? "预览未通过");
          return;
        }
        previewed.value = requestFingerprint;
      } else {
        const result = await currentApis.createPreviewAPI(
          toCurrentCreateInput(profile, grants.value),
        );
        if (
          !visible.value ||
          requestSession !== previewSession.value ||
          requestFingerprint !== fingerprint.value
        )
          return;
        currentPreview.value = result.data;
        previewed.value = result.data.valid ? requestFingerprint : "";
      }
    } catch (error) {
      void iamEditorFailure(error);
      return;
    } finally {
      if (requestSession === previewSession.value) saving.value = false;
    }
  }
  step.value = Math.min(steps.value.length - 1, step.value + 1);
};

const fingerprint = computed(() => JSON.stringify(profile) + grantsFingerprint(grants.value));
const privateSubmit = (): void => {
  if (!props.createApi && platform.value) return;
  if (previewed.value !== fingerprint.value) {
    Message.warning("草稿已变化，请重新预览");
    return;
  }
  saving.value = true;
  const request = platform.value
    ? props.createApi!({
        ...toCreateInput(profile, grants.value, props.kind),
        versionName: versionName.value.trim(),
        remark: versionRemark.value.trim(),
      })
    : currentApis.createAPI(toCurrentCreateInput(profile, grants.value));
  request
    .then(async () => {
      if (!platform.value) {
        await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() =>
          Message.warning("已创建，权限刷新暂不可用，请稍后重试"),
        );
      }
      Message.success(
        platform.value ? "已创建并发布首个版本，既有授权不会自动升级" : "已创建，关联组织立即生效",
      );
      visible.value = false;
      emits("success");
    })
    .catch((error: unknown) => {
      previewed.value = "";
      void iamEditorFailure(error);
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({
  show() {
    reset();
    visible.value = true;
  },
});
</script>
