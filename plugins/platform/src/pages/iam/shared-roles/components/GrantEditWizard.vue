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
    <div class="flex h-full min-h-0">
      <wizard-nav :steps="GRANT_WIZARD_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ GRANT_WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 0 ? 'overflow-hidden' : 'overflow-auto'">
          <grant-picker v-if="step === 0" :key="session" v-model="grants" :domain="domain" />
          <scope-step v-else-if="step === 1" v-model="grants" />
          <preview-panel
            v-else
            :profile="profile"
            :grants="grants"
            :show-profile="false"
            hint="发布新版本不会自动升级已有授权。"
          />
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < 2" type="primary" @in-click="privateNext">下一步</in-button>
      <in-button v-else type="primary" :loading="saving" :disabled="!changed" @in-click="privateSubmit">
        发布新版本
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { confirmUnsavedChanges, Message, type R } from "@ingot/admin-core";
import { AuthorizationDomain, type CreatedResource, type RolePublishInput } from "@ingot/admin-common";
import { PlatformSharedRolePublishAPI } from "@/api/iam/authorization";
import GrantPicker from "./GrantPicker.vue";
import PreviewPanel from "./PreviewPanel.vue";
import ScopeStep from "./ScopeStep.vue";
import WizardNav from "./WizardNav.vue";
import {
  GRANT_WIZARD_STEPS,
  grantsFingerprint,
  missingParameterKeys,
  toPublishInput,
  type SelectedGrant,
  type WizardProfile,
} from "../wizard";

defineOptions({ name: "GrantEditWizard" });

const props = withDefaults(
  defineProps<{
    publishApi?: (id: string, input: RolePublishInput) => Promise<R<CreatedResource>>;
    domain?: AuthorizationDomain;
  }>(),
  {
    domain: AuthorizationDomain.TENANT,
  },
);

const emits = defineEmits<{ success: [] }>();
const submitApi = computed(() => props.publishApi ?? PlatformSharedRolePublishAPI);
const visible = ref(false);
const saving = ref(false);
const step = ref(0);
const roleId = ref("");
const expectedVersion = ref("");
const profile = reactive<WizardProfile>({ code: "", name: "", description: "", groupName: "" });
const grants = ref<SelectedGrant[]>([]);
const baseline = ref("");
const session = ref(0);

const changed = computed(() => grantsFingerprint(grants.value) !== baseline.value);

const reset = (): void => {
  step.value = 0;
  grants.value = [];
  baseline.value = "";
  saving.value = false;
};

const privateOnBeforeClose = (done: () => void): void => {
  if (!changed.value) {
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

const privateNext = (): void => {
  if (step.value === 0 && !grants.value.length) {
    Message.warning("请至少选择一条操作");
    return;
  }
  if (step.value === 1) {
    const missing = missingParameterKeys(grants.value);
    if (missing.length) {
      Message.warning(`请为 ${missing[0]} 填写参数键`);
      return;
    }
  }
  step.value = Math.min(2, step.value + 1);
};

const privateSubmit = (): void => {
  if (!changed.value) {
    Message.warning("操作授权没有变化，无需发布");
    return;
  }
  saving.value = true;
  submitApi.value(roleId.value, toPublishInput(expectedVersion.value, grants.value))
    .then(() => {
      Message.success("已发布新版本，既有授权仍钉在旧版本");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({
  show(input: { roleId: string; version: string; profile: WizardProfile; grants: SelectedGrant[] }) {
    reset();
    roleId.value = input.roleId;
    expectedVersion.value = input.version;
    Object.assign(profile, input.profile);
    grants.value = input.grants.map((item) => ({
      ...item,
      scopes: item.scopes.map((scope) => ({ ...scope })),
      scopeCapabilities: [...item.scopeCapabilities],
    }));
    baseline.value = grantsFingerprint(grants.value);
    session.value += 1;
    visible.value = true;
  },
});
</script>
