<template>
  <div class="policy-tab-panel" v-loading="saving">
    <div class="panel-toolbar">
      <div class="panel-toolbar__actions">
        <template v-if="editing">
          <in-button @click="privateOnCancelClick">取消</in-button>
          <in-button type="primary" :loading="saving" @click="privateOnSaveClick"> 保存 </in-button>
        </template>
        <in-button v-else type="primary" @click="privateOnEditClick">编辑</in-button>
      </div>
    </div>

    <in-form class="policy-form" :model="{ enabled }" :disabled="!editing">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="是否启用">
            <el-switch v-model="enabled" inline-prompt active-text="是" inactive-text="否" />
          </el-form-item>
        </el-col>
      </el-row>
    </in-form>

    <component :is="currentComponent" ref="viewRef" :disabled="!editing" />
  </div>
</template>
<script setup lang="ts">
import type { CredentialPolicyConfig } from "@/models";
import { CredentialPolicyTypeEnum, useCredentialPolicyTypeEnum } from "@/models/enums";
import type { SavePolicyFn } from "../useCredentialPolicy";
import StrengthView from "../view/StrengthView.vue";
import HistoryView from "../view/HistoryView.vue";
import ExpirationView from "../view/ExpirationView.vue";
import InitialPasswordView from "../view/InitialPasswordView.vue";

interface PolicyViewExpose {
  setForm: (form: Record<string, unknown>) => void;
  getForm: () => Promise<Record<string, unknown>>;
}

const props = defineProps<{
  policyType: string;
  config?: CredentialPolicyConfig;
  savePolicy: SavePolicyFn;
}>();

const emits = defineEmits<{ saved: [] }>();

const credentialPolicyTypeEnum = useCredentialPolicyTypeEnum();
const confirm = useMessageConfirm();

const editing = ref(false);
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

const policyTypeLabel = computed(
  () => credentialPolicyTypeEnum.getTagText(props.policyType).text,
);

const syncForm = (config?: CredentialPolicyConfig): void => {
  enabled.value = config?.enabled ?? true;
  nextTick(() => {
    viewRef.value?.setForm(config?.policyConfig ?? {});
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
  editing.value = true;
};

const privateOnCancelClick = (): void => {
  editing.value = false;
  syncForm(props.config);
};

const privateOnSaveClick = (): void => {
  if (!viewRef.value) {
    return;
  }

  confirm.warning(`确认保存「${policyTypeLabel.value}」策略配置？`).then(async () => {
    saving.value = true;
    try {
      const policyConfig = await viewRef.value!.getForm();
      await props.savePolicy(
        props.policyType,
        {
          id: props.config?.id,
          enabled: enabled.value,
        },
        policyConfig,
      );
      editing.value = false;
      emits("saved");
    } catch {
      // 表单校验失败或用户取消时不处理
    } finally {
      saving.value = false;
    }
  });
};
</script>
<style lang="postcss" scoped>
.policy-tab-panel {
  & .panel-toolbar {
    @apply flex flex-row justify-end items-center mb-16px;
  }

  & .panel-toolbar__actions {
    @apply flex flex-row items-center gap-2;
  }
}
</style>
