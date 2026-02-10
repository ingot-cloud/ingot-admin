<template>
  <in-drawer :title="title" v-model="visible" @close="loading = false" width="40%">
    <in-form ref="EditFormRef" :model="editForm">
      <el-form-item label="策略类型" prop="policyType" label-position="top">
        <in-select
          v-model="editForm.policyType"
          :options="credentialPolicyTypeEnum.getOptions()"
          :disabled="editFlag"
          placeholder="请选择策略类型"
        />
      </el-form-item>
      <el-form-item label="优先级" prop="priority" label-position="top">
        <el-input v-model="editForm.priority" type="number" clearable placeholder="请输入优先级" />
      </el-form-item>
      <el-form-item label="是否启用" prop="enabled" label-position="top">
        <el-switch v-model="editForm.enabled" inline-prompt active-text="是" inactive-text="否" />
      </el-form-item>
    </in-form>
    <component :is="currentComponent" ref="currentComponentRef" />
    <template #footer>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import { useCredentialPolicyTypeEnum, CredentialPolicyTypeEnum } from "@/models/enums";
import type { CredentialPolicyConfig } from "@/models";
import { CreatePolicyConfig, UpdatePolicyConfig } from "@/api/platform/security/credential";
import StrengthView from "./view/StrengthView.vue";
import HistoryView from "./view/HistoryView.vue";
import ExpirationView from "./view/ExpirationView.vue";

const emits = defineEmits(["success"]);
const currentComponentRef = ref();
const credentialPolicyTypeEnum = useCredentialPolicyTypeEnum();
const message = useMessage();

const currentComponent = computed(() => {
  switch (editForm.policyType) {
    case CredentialPolicyTypeEnum.STRENGTH:
      return StrengthView;
    case CredentialPolicyTypeEnum.HISTORY:
      return HistoryView;
    case CredentialPolicyTypeEnum.EXPIRATION:
      return ExpirationView;
    default:
      return StrengthView;
  }
});

const EditFormRef = ref();
const editFlag = ref(false);
const loading = ref(false);
const title = ref("添加凭证策略");
const visible = ref(false);
const editForm = reactive<CredentialPolicyConfig>({
  id: undefined,
  policyType: CredentialPolicyTypeEnum.STRENGTH,
  priority: undefined,
  enabled: true,
  policyConfig: {},
});

const handleConfirmClick = () => {
  currentComponentRef.value.getForm().then((form: any) => {
    const request = editFlag.value ? UpdatePolicyConfig : CreatePolicyConfig;
    loading.value = true;
    editForm.policyConfig = form;
    request({
      ...editForm,
    })
      .then(() => {
        loading.value = false;
        message.success("操作成功");
        visible.value = false;
        emits("success");
      })
      .catch(() => {
        loading.value = false;
      });
  });
};

defineExpose({
  show(params?: CredentialPolicyConfig) {
    visible.value = true;

    if (params) {
      Object.assign(editForm, params);
      editFlag.value = true;
      title.value = "编辑凭证策略";
      nextTick(() => {
        currentComponentRef.value.setForm(params?.policyConfig);
      });
    } else {
      Object.assign(editForm, {
        id: undefined,
        policyType: CredentialPolicyTypeEnum.STRENGTH,
        priority: undefined,
        enabled: true,
        policyConfig: {},
      });
      editFlag.value = false;
      title.value = "添加凭证策略";
    }
    nextTick(() => {
      EditFormRef.value.clearValidate();
    });
  },
});
</script>
