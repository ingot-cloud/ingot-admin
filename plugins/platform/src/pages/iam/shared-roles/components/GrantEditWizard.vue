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
        <button type="button" class="grant-close" @click="privateAskClose">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20.778 20.778a1 1 0 0 0 0-1.414L13.414 12l7.364-7.364a1 1 0 0 0-1.414-1.414L12 10.586 4.636 3.222a1 1 0 0 0-1.414 1.414L10.586 12l-7.364 7.364a1 1 0 1 0 1.414 1.414L12 13.414l7.364 7.364a1 1 0 0 0 1.414 0Z"
              fill="currentColor"
            />
          </svg>
          关闭
        </button>
        <span class="w-1px h-16px bg-[var(--in-border-color)]" />
        <span>编辑权限</span>
      </div>
    </template>
    <div class="flex h-full min-h-0">
      <wizard-nav :steps="GRANT_WIZARD_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ GRANT_WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 0 ? 'overflow-hidden' : 'overflow-auto'">
          <grant-picker v-if="step === 0" :key="session" v-model="grants" />
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
import { confirmUnsavedChanges, Message } from "@ingot/admin-core";
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

const emits = defineEmits<{ success: [] }>();
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

const privateClose = (): void => {
  visible.value = false;
};

const privateAskClose = (): void => {
  if (!changed.value) {
    privateClose();
    return;
  }
  void confirmUnsavedChanges().then((allowed) => {
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
  PlatformSharedRolePublishAPI(roleId.value, toPublishInput(expectedVersion.value, grants.value))
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

<style lang="postcss" scoped>
.grant-close {
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

.grant-close svg {
  font-size: 16px;
}

.grant-close:hover {
  background: var(--in-bg-color-hover);
  color: var(--in-text-color);
}

.grant-close:active {
  background: var(--in-bg-color-active);
}
</style>
