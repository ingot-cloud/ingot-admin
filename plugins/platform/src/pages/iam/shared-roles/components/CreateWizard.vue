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
              <el-input v-model="profile.code" placeholder="发布后不可改" />
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
          <grant-picker v-else-if="step === 1" v-model="grants" :domain="grantDomain" />
          <scope-step v-else-if="step === 2" v-model="grants" :domain="grantDomain" />
          <field-step v-else-if="platform && step === 3" ref="fieldStep" v-model="grants" />
          <preview-panel v-else :profile="profile" :grants="grants" />
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
        :disabled="platform && previewed !== fingerprint"
        :loading="saving"
        @in-click="privateSubmit"
      >
        创建并发布首个版本
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { confirmUnsavedChanges, Message, type R } from "@ingot/admin-core";
import {
  AuthorizationDomain,
  RoleKind,
  type CreatedResource,
  type RoleCreateInput,
  type RoleCreateKind,
} from "@ingot/admin-common";
import { PlatformRoleCreatePreviewAPI, PlatformSharedRoleCreateAPI } from "@/api/iam/authorization";
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
const submitApi = computed(() => props.createApi ?? PlatformSharedRoleCreateAPI);
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
const visible = ref(false);
const saving = ref(false);
const step = ref(0);
const profile = reactive(emptyWizardProfile());
const grants = ref<SelectedGrant[]>([]);

const dirty = computed(() => profileDirty(profile) || grants.value.length > 0);

const reset = (): void => {
  previewSession.value += 1;
  step.value = 0;
  Object.assign(profile, emptyWizardProfile());
  grants.value = [];
  saving.value = false;
  previewed.value = "";
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
  if (platform.value && step.value === steps.value.length - 2) {
    saving.value = true;
    const requestFingerprint = fingerprint.value;
    const requestSession = previewSession.value;
    try {
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
    } finally {
      if (requestSession === previewSession.value) saving.value = false;
    }
  }
  step.value = Math.min(steps.value.length - 1, step.value + 1);
};

const fingerprint = computed(() => JSON.stringify(profile) + grantsFingerprint(grants.value));
const privateSubmit = (): void => {
  if (platform.value && previewed.value !== fingerprint.value) {
    Message.warning("草稿已变化，请重新预览");
    return;
  }
  saving.value = true;
  submitApi
    .value(toCreateInput(profile, grants.value, props.kind))
    .then(() => {
      Message.success("已创建并发布首个版本，既有授权不会自动升级");
      visible.value = false;
      emits("success");
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
