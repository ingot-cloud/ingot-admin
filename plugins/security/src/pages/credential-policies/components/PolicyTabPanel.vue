<template>
  <in-loading :loading="saving" class="policy-tab-panel">
    <div class="panel-toolbar">
      <div class="panel-toolbar__title">{{ policyTypeLabel }}设置</div>
      <div class="panel-toolbar__actions">
        <template v-if="editing && canWrite">
          <in-button :disabled="saving" @click="privateOnCancelClick">取消</in-button>
          <in-button type="primary" :loading="saving" @click="privateOnSaveClick"> 保存 </in-button>
        </template>
        <in-button v-else-if="canWrite" type="primary" @click="privateOnEditClick">编辑</in-button>
      </div>
    </div>

    <in-form :disabled="saving" class="policy-form" :model="{ enabled }" :editing="editing">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :lg="8">
          <in-detail-field label="是否启用" :value="enabled ? '启用' : '停用'">
            <el-switch
              v-if="editing"
              v-model="enabled"
              inline-prompt
              active-text="是"
              inactive-text="否"
            />
          </in-detail-field>
        </el-col>
      </el-row>
    </in-form>

    <component :is="currentComponent" ref="viewRef" :editing="editing" />
  </in-loading>
</template>
<script setup lang="ts">
import { useCapabilities } from "@ingot/admin-core";
import { SecurityAction } from "@/hooks/useSecurityTabs";
import type { CredentialPolicyConfig } from "@/models";
import { CredentialPolicyTypeEnum, useCredentialPolicyTypeEnum } from "@/models/enums";
import type { SavePolicyFn } from "../useCredentialPolicy";
import { normalizeCredentialFormValues } from "../form-values";
import StrengthView from "../view/StrengthView.vue";
import HistoryView from "../view/HistoryView.vue";
import ExpirationView from "../view/ExpirationView.vue";
import InitialPasswordView from "../view/InitialPasswordView.vue";

interface PolicyViewExpose {
  setForm: (form: Record<string, unknown>) => void;
  getForm: () => Promise<Record<string, unknown>>;
}

const props = defineProps<{
  policyType: CredentialPolicyTypeEnum;
  config?: CredentialPolicyConfig;
  savePolicy: SavePolicyFn;
}>();

const { hasAction } = useCapabilities();
const canWrite = computed(() =>
  hasAction(props.config?.id ? SecurityAction.CREDENTIAL_UPDATE : SecurityAction.CREDENTIAL_CREATE),
);
const emits = defineEmits<{ saved: [] }>();

const credentialPolicyTypeEnum = useCredentialPolicyTypeEnum();
const confirm = useMessageConfirm();

const editing = ref(false);
watch(canWrite, (allowed) => {
  if (!allowed) privateOnCancelClick();
});
const enabled = ref(true);
const saving = ref(false);
const viewRef = ref<PolicyViewExpose>();

const currentComponent = computed(() => {
  switch (props.policyType) {
    case CredentialPolicyTypeEnum.STRENGTH:
      return StrengthView;
    case CredentialPolicyTypeEnum.HISTORY:
      return HistoryView;
    case CredentialPolicyTypeEnum.EXPIRATION:
      return ExpirationView;
    case CredentialPolicyTypeEnum.INITIAL_PASSWORD:
      return InitialPasswordView;
    default:
      return StrengthView;
  }
});

const policyTypeLabel = computed(() => credentialPolicyTypeEnum.getTagText(props.policyType).text);

const syncForm = (config?: CredentialPolicyConfig): void => {
  enabled.value = config?.enabled ?? true;
  nextTick(() => {
    viewRef.value?.setForm(
      normalizeCredentialFormValues(props.policyType, config?.policyConfig ?? {}),
    );
  });
};

watch(
  () => props.config,
  (config) => {
    if (editing.value) {
      return;
    }
    syncForm(config);
  },
  { immediate: true },
);

const privateOnEditClick = (): void => {
  if (!canWrite.value) return;
  editing.value = true;
};

const privateOnCancelClick = (): void => {
  editing.value = false;
  syncForm(props.config);
};

const privateOnSaveClick = async (): Promise<void> => {
  if (!editing.value || !canWrite.value || saving.value || !viewRef.value) return;
  try {
    const policyConfig = await viewRef.value.getForm();
    await confirm.warning(`确认保存「${policyTypeLabel.value}」策略配置？`);
    if (!canWrite.value) return;
    saving.value = true;
    await props.savePolicy(
      props.policyType,
      { id: props.config?.id, enabled: enabled.value },
      policyConfig,
    );
    editing.value = false;
    syncForm(props.config);
    emits("saved");
  } catch {
    // Validation, cancellation or request failure keeps the current draft.
  } finally {
    saving.value = false;
  }
};
</script>
<style lang="postcss" scoped>
.policy-tab-panel {
  & .panel-toolbar {
    @apply flex flex-row justify-between items-center mb-16px;
  }

  & .panel-toolbar__title {
    @apply min-w-0;
    font-size: var(--in-font-size-section-title);
    font-weight: var(--in-font-weight-section-title);
  }

  & .panel-toolbar__actions {
    @apply flex flex-row items-center gap-2;
  }
}
</style>
