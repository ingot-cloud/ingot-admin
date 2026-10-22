<template>
  <in-drawer
    v-model="visible"
    title="创建角色"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="CREATE_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ CREATE_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 1 ? 'overflow-hidden' : 'overflow-auto'">
          <in-form v-if="step === 0" class="max-w-560px">
            <el-form-item label="名称" required>
              <el-input v-model="profile.name" placeholder="请输入角色名称" />
            </el-form-item>
            <el-form-item label="说明">
              <el-input
                v-model="profile.description"
                type="textarea"
                :rows="3"
                placeholder="请输入角色说明"
              />
            </el-form-item>
            <el-form-item label="分组">
              <el-input v-model="profile.groupName" placeholder="请输入分组，可空" />
            </el-form-item>
          </in-form>
          <grant-picker
            v-else-if="step === 1"
            :key="session"
            v-model="grants"
            :catalog-a-p-i="catalogAPI"
            :application-candidates="applicationCandidates"
          />
          <scope-step v-else-if="step === 2" v-model="grants" />
          <biz-iam-role-field-step v-else-if="step === 3" ref="fieldStep" v-model="grants" />
          <div v-else class="flex flex-col gap-16px">
            <div>
              <div class="text-18px">{{ profile.name }}</div>
              <div class="mt-8px text-12px text-[var(--el-text-color-secondary)]">
                {{ profile.description || "暂无说明" }}
              </div>
              <div v-if="profile.groupName" class="mt-4px text-12px">分组：{{ profile.groupName }}</div>
            </div>
            <grant-preview :grants="grants" />
            <biz-iam-preview-alert :preview="currentPreview" />
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="step = Math.max(0, step - 1)">上一步</in-button>
      <in-button v-if="step < CREATE_STEPS.length - 1" type="primary" @in-click="privateNext"
        >下一步</in-button
      >
      <in-button
        v-else
        type="primary"
        :loading="saving"
        :disabled="previewed !== fingerprint"
        @in-click="privateSubmit"
        >创建角色</in-button
      >
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, confirmUnsavedChanges } from "@ingot/admin-core";
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
import {
  CREATE_STEPS,
  createRoleCode,
  emptyProfile,
  grantsFingerprint,
  toCreateInput,
  type RoleProfile,
  type SelectedGrant,
} from "../grants";

defineOptions({ name: "CreateWizard" });

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
const profile = reactive<RoleProfile>(emptyProfile());
const code = ref("");
const grants = ref<SelectedGrant[]>([]);
const previewed = ref("");
const currentPreview = ref<Preview<CurrentRolePreviewResult>>();
const fingerprint = computed(
  () =>
    JSON.stringify({
      name: profile.name,
      description: profile.description,
      groupName: profile.groupName,
    }) + grantsFingerprint(grants.value),
);
const dirty = computed(
  () => Boolean(profile.name || profile.description || profile.groupName || grants.value.length),
);

watch(
  [() => profile.name, () => profile.description, () => profile.groupName, grants],
  () => {
    previewed.value = "";
    currentPreview.value = undefined;
  },
  { deep: true },
);

const privateReset = (): void => {
  session.value += 1;
  step.value = 0;
  Object.assign(profile, emptyProfile());
  code.value = createRoleCode();
  grants.value = [];
  previewed.value = "";
  currentPreview.value = undefined;
};

const privateOnBeforeClose = (done: () => void): void => {
  if (!dirty.value) {
    done();
    return;
  }
  void confirmUnsavedChanges().then((allowed) => {
    if (allowed) done();
  });
};

const privateNext = async (): Promise<void> => {
  if (step.value === 0 && !profile.name.trim()) {
    Message.warning("请填写角色名称");
    return;
  }
  if (step.value === 1 && !grants.value.length) {
    Message.warning("请至少选择一条权限");
    return;
  }
  if (step.value === 3 && !fieldStep.value?.validate()) return;
  if (step.value === CREATE_STEPS.length - 2) {
    saving.value = true;
    const requestFingerprint = fingerprint.value;
    try {
      const result = await apis.createPreviewAPI(toCreateInput(profile, code.value, grants.value));
      if (!visible.value || requestFingerprint !== fingerprint.value) return;
      currentPreview.value = result.data;
      previewed.value = result.data.valid ? requestFingerprint : "";
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
  step.value = Math.min(CREATE_STEPS.length - 1, step.value + 1);
};

const privateSubmit = (): void => {
  if (previewed.value !== fingerprint.value) {
    Message.warning("草稿已变化，请重新预览");
    return;
  }
  saving.value = true;
  apis
    .createAPI(toCreateInput(profile, code.value, grants.value))
    .then(() => {
      Message.success("已创建角色");
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
    privateReset();
    visible.value = true;
  },
});
</script>
