<template>
  <in-drawer
    :title="title"
    v-model="visible"
    class="security-policy-drawer"
    layout="pinned"
    size="min(640px, 100vw)"
    :before-close="beforeClose"
  >
    <in-form
      class="policy-form"
      :editing="editing"
      ref="editFormRef"
      :model="editForm"
      :rules="rules"
    >
      <in-detail-field label="编码" prop="code" :value="editForm.code">
        <el-input
          v-if="editing"
          v-model="editForm.code"
          :disabled="edit"
          clearable
          placeholder="英文、数字、连字符"
        />
      </in-detail-field>
      <in-detail-field label="名称" prop="name" :value="editForm.name">
        <el-input v-if="editing" v-model="editForm.name" clearable placeholder="请输入展示名称" />
      </in-detail-field>
      <in-detail-field label="路径规则" prop="patternList" :value="editForm.patternList">
        <PatternListEditor
          v-if="editing"
          v-model="editForm.patternList"
          prop-prefix="patternList"
        />

        <template #view><PatternListPreview :patterns="editForm.patternList" /></template>
      </in-detail-field>
      <in-detail-field label="是否启用" :value="editForm.enabled ? '启用' : '停用'">
        <el-switch
          v-if="editing"
          v-model="editForm.enabled"
          inline-prompt
          active-text="是"
          inactive-text="否"
        />
      </in-detail-field>
      <in-detail-field label="备注" :value="editForm.remark">
        <el-input
          v-if="editing"
          v-model="editForm.remark"
          type="textarea"
          :rows="3"
          clearable
          placeholder="请输入备注"
        />
      </in-detail-field>
    </in-form>
    <template #footer>
      <template v-if="editing">
        <in-button :disabled="loading" @click="cancelEdit">取消</in-button>
        <in-button v-if="canWrite" :loading="loading" type="primary" @click="privateOnConfirmClick"
          >保存</in-button
        >
      </template>
      <in-button v-else-if="canWrite" type="primary" @click="enterEdit">编辑</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { useSecurityPolicyDrawer } from "@/hooks/useSecurityPolicyDrawer";
import { useCapabilities } from "@ingot/admin-core";
const { hasAction } = useCapabilities();
import { SecurityAction } from "@/hooks/useSecurityTabs";
import type { GatewayEndpointGroup, GatewayEndpointPattern } from "@/models";
import { HttpMethodEnum } from "@/models/enums";
import { copyParams } from "@ingot/admin-core";
import { CreateEndpointGroupAPI, UpdateEndpointGroupAPI } from "@/api/security/policy";
import PatternListEditor from "./PatternListEditor.vue";
import PatternListPreview from "./PatternListPreview.vue";

const CODE_PATTERN = /^[a-zA-Z0-9-]+$/;
const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

type EndpointGroupForm = GatewayEndpointGroup & {
  patternList: Array<GatewayEndpointPattern>;
};

const defaultEditForm: EndpointGroupForm = {
  id: undefined,
  code: undefined,
  name: undefined,
  patternList: [{ path: "", method: HttpMethodEnum.POST }],
  enabled: true,
  remark: undefined,
};

const emits = defineEmits<{ success: [] }>();

const editFormRef = ref<FormInstance>();
const editForm = reactive<EndpointGroupForm>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);
const canWrite = computed(() =>
  hasAction(edit.value ? SecurityAction.POLICY_UPDATE : SecurityAction.POLICY_CREATE),
);
const { editing, enterEdit, cancelEdit, open, beforeClose } = useSecurityPolicyDrawer({
  form: editForm,
  formRef: editFormRef,
  visible,
  existing: edit,
  canWrite,
  saving: loading,
});

const message = useMessage();
const rules = {
  code: [
    { required: true, message: "请输入编码", trigger: "blur" },
    {
      pattern: CODE_PATTERN,
      message: "编码仅支持英文、数字和连字符",
      trigger: "blur",
    },
  ],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  patternList: [{ required: true, message: "请至少添加一条路径规则", trigger: "change" }],
};

const privateOnConfirmClick = (): void => {
  if (!editing.value || !canWrite.value || loading.value) return;
  if (!hasAction(edit.value ? SecurityAction.POLICY_UPDATE : SecurityAction.POLICY_CREATE)) return;
  const form = unref(editFormRef);
  form?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    loading.value = true;
    const request = edit.value
      ? UpdateEndpointGroupAPI(Object.assign({}, toRaw(editForm)))
      : CreateEndpointGroupAPI(Object.assign({}, toRaw(editForm)));

    request
      .then(() => {
        message.success(POLICY_EFFECT_MESSAGE);
        visible.value = false;
        emits("success");
      })
      .catch(() => {
        /* The request layer displays errors; keep the draft. */
      })
      .finally(() => {
        loading.value = false;
      });
  });
};

defineExpose({
  show(data?: GatewayEndpointGroup) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    editForm.patternList = [{ path: "", method: HttpMethodEnum.POST }];
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      title.value = "路径分组详情";
      edit.value = true;
      open(true);
      copyParams(editForm, data);
      editForm.patternList = data.patternList?.length
        ? data.patternList.map((item) => ({ ...item }))
        : [{ path: "", method: HttpMethodEnum.POST }];
      return;
    }

    title.value = "新建路径分组";
    edit.value = false;
    open(false);
  },
});
</script>
