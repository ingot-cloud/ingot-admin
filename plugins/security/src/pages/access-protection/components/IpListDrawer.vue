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
      <in-detail-field
        label="名单类型"
        prop="listType"
        :value="
          ipListTypeEnum.getOptions().find((item) => item.value === editForm.listType)?.label ??
          editForm.listType
        "
      >
        <in-select
          v-if="editing"
          v-model="editForm.listType"
          :options="ipListTypeEnum.getOptions()"
          placeholder="请选择名单类型"
        />
      </in-detail-field>
      <in-detail-field
        label="Key 类型"
        prop="keyType"
        :value="
          ipListKeyTypeEnum.getOptions().find((item) => item.value === editForm.keyType)?.label ??
          editForm.keyType
        "
      >
        <in-select
          v-if="editing"
          v-model="editForm.keyType"
          :options="ipListKeyTypeEnum.getOptions()"
          placeholder="请选择 Key 类型"
        />
      </in-detail-field>
      <in-detail-field label="匹配值" prop="keyValue" :value="editForm.keyValue">
        <el-input v-if="editing" v-model="editForm.keyValue" clearable placeholder="请输入匹配值" />
      </in-detail-field>
      <in-detail-field label="原因" :value="editForm.reason">
        <el-input v-if="editing" v-model="editForm.reason" clearable placeholder="请输入原因" />
      </in-detail-field>
      <in-detail-field
        label="生效时间"
        :value="editForm.effectiveAt ? formatDateTime(editForm.effectiveAt) : '立即生效'"
      >
        <el-date-picker
          v-if="editing"
          v-model="effectiveAtDate"
          type="datetime"
          clearable
          placeholder="留空表示立即生效"
          class="w-full"
        />
      </in-detail-field>
      <in-detail-field
        label="失效时间"
        :value="editForm.expiresAt ? formatDateTime(editForm.expiresAt) : '永久有效'"
      >
        <el-date-picker
          v-if="editing"
          v-model="expiresAtDate"
          type="datetime"
          clearable
          placeholder="留空表示永久有效"
          class="w-full"
        />
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
import { formatDateTime, parseInstantDate, toApiInstant } from "@ingot/shared";
import type { GatewayIpList } from "@/models";
import {
  IpListKeyTypeEnum,
  IpListTypeEnum,
  useIpListKeyTypeEnum,
  useIpListTypeEnum,
} from "@/models/enums";
import { copyParams } from "@ingot/admin-core";
import { CreateIpListAPI, UpdateIpListAPI } from "@/api/security/policy";

const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

const defaultEditForm: GatewayIpList = {
  id: undefined,
  listType: IpListTypeEnum.BLACK,
  keyType: IpListKeyTypeEnum.IP,
  keyValue: undefined,
  reason: undefined,
  source: undefined,
  effectiveAt: undefined,
  expiresAt: undefined,
  enabled: true,
};

const emits = defineEmits<{ success: [] }>();

const ipListTypeEnum = useIpListTypeEnum();
const ipListKeyTypeEnum = useIpListKeyTypeEnum();

const editFormRef = ref<FormInstance>();
const editForm = reactive<GatewayIpList>(Object.assign({}, defaultEditForm));
const effectiveAtDate = computed({
  get: () => parseInstantDate(editForm.effectiveAt),
  set: (value: Date | null) => {
    editForm.effectiveAt = toApiInstant(value);
  },
});
const expiresAtDate = computed({
  get: () => parseInstantDate(editForm.expiresAt),
  set: (value: Date | null) => {
    editForm.expiresAt = toApiInstant(value);
  },
});
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
  listType: [{ required: true, message: "请选择名单类型", trigger: "change" }],
  keyType: [{ required: true, message: "请选择 Key 类型", trigger: "change" }],
  keyValue: [{ required: true, message: "请输入匹配值", trigger: "blur" }],
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
      ? UpdateIpListAPI(Object.assign({}, toRaw(editForm)))
      : CreateIpListAPI(Object.assign({}, toRaw(editForm)));

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
  show(data?: GatewayIpList) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      title.value = "黑白名单详情";
      edit.value = true;
      open(true);
      copyParams(editForm, data);
      return;
    }

    title.value = "新建黑白名单";
    edit.value = false;
    open(false);
  },
});
</script>
