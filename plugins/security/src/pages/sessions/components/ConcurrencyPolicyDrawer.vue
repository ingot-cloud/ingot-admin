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
        label="生效范围"
        prop="scope"
        :value="
          scopeEnum.getOptions().find((item) => item.value === editForm.scope)?.label ??
          editForm.scope
        "
      >
        <in-select
          v-if="editing"
          v-model="editForm.scope"
          :options="scopeEnum.getOptions()"
          placeholder="请选择生效范围"
          @change="privateOnScopeChange"
        />
      </in-detail-field>
      <in-detail-field
        v-if="editForm.scope === SessionConcurrencyScopeEnum.CLIENT"
        label="客户端"
        prop="clientId"
        :value="editForm.clientId"
      >
        <ClientIdField v-if="editing" v-model="editForm.clientId" />
      </in-detail-field>
      <in-detail-field
        v-if="editForm.scope === SessionConcurrencyScopeEnum.USER_TYPE"
        label="用户类型"
        prop="userType"
        :value="
          userTypeEnum.getOptions().find((item) => item.value === editForm.userType)?.label ??
          editForm.userType
        "
      >
        <in-select
          v-if="editing"
          v-model="editForm.userType"
          :options="userTypeEnum.getOptions()"
          placeholder="请选择用户类型"
        />
      </in-detail-field>
      <in-detail-field
        label="最大会话数"
        prop="maxSessions"
        :value="editForm.maxSessions === 0 ? '不限制' : editForm.maxSessions"
      >
        <el-input-number
          v-if="editing"
          v-model="editForm.maxSessions"
          :min="0"
          class="w-full"
          placeholder="请输入最大会话数"
        />
        <div class="field-tip">0 表示不限制</div>
      </in-detail-field>
      <in-detail-field
        label="超出处置"
        prop="overflow"
        :value="
          overflowEnum.getOptions().find((item) => item.value === editForm.overflow)?.label ??
          editForm.overflow
        "
      >
        <in-select
          v-if="editing"
          v-model="editForm.overflow"
          :options="overflowEnum.getOptions()"
          placeholder="请选择超出处置"
        />
      </in-detail-field>
      <in-detail-field label="管理用户单会话" :value="editForm.adminForbidConcurrent ? '是' : '否'">
        <el-switch
          v-if="editing"
          v-model="editForm.adminForbidConcurrent"
          inline-prompt
          active-text="是"
          inactive-text="否"
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
      <in-detail-field label="备注" :value="editForm.remark">
        <el-input
          v-if="editing"
          v-model="editForm.remark"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="请输入备注"
        />
      </in-detail-field>
    </in-form>
    <template #footer>
      <in-button
        v-if="edit && !editing && editForm.scope !== SessionConcurrencyScopeEnum.GLOBAL"
        v-auth="SecurityAction.CONCURRENCY_UPDATE"
        type="danger"
        :disabled="loading"
        @click="privateOnRemoveClick"
        >删除</in-button
      >
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
import { SecurityAction } from "@/hooks/useSecurityTabs";
const { hasAction } = useCapabilities();
import type { SessionConcurrencyPolicy } from "@/models";
import {
  SessionConcurrencyDimensionEnum,
  SessionConcurrencyOverflowEnum,
  SessionConcurrencyScopeEnum,
  useSessionConcurrencyOverflowEnum,
  useSessionConcurrencyScopeEnum,
  useSessionUserTypeEnum,
} from "@/models/enums";
import { copyParams } from "@ingot/admin-core";
import {
  CreateConcurrencyPolicyAPI,
  DeleteConcurrencyPolicyAPI,
  UpdateConcurrencyPolicyAPI,
} from "@/api/security/concurrencyPolicy";
import ClientIdField from "./ClientIdField.vue";

const POLICY_SAVE_MESSAGE = "已保存，下次登录生效；已在线会话不受影响";

const defaultEditForm: SessionConcurrencyPolicy = {
  id: undefined,
  scope: SessionConcurrencyScopeEnum.CLIENT,
  clientId: "",
  userType: "",
  maxSessions: 1,
  dimension: SessionConcurrencyDimensionEnum.USER_CLIENT,
  overflow: SessionConcurrencyOverflowEnum.KICK_OLDEST,
  adminForbidConcurrent: false,
  enabled: true,
  remark: "",
};

const emits = defineEmits<{ success: [] }>();

const scopeEnum = useSessionConcurrencyScopeEnum();
const overflowEnum = useSessionConcurrencyOverflowEnum();
const userTypeEnum = useSessionUserTypeEnum();

const editFormRef = ref<FormInstance>();
const editForm = reactive<SessionConcurrencyPolicy>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);
const canWrite = computed(() => hasAction(SecurityAction.CONCURRENCY_UPDATE));
const { editing, enterEdit, cancelEdit, open, beforeClose } = useSecurityPolicyDrawer({
  form: editForm,
  formRef: editFormRef,
  visible,
  existing: edit,
  canWrite,
  saving: loading,
});

const message = useMessage();
const confirm = useMessageConfirm();

const rules = {
  scope: [{ required: true, message: "请选择生效范围", trigger: "change" }],
  clientId: [
    {
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        if (editForm.scope === SessionConcurrencyScopeEnum.CLIENT && !editForm.clientId) {
          callback(new Error("按客户端生效的策略必须指定客户端"));
          return;
        }
        callback();
      },
      trigger: "change",
    },
  ],
  userType: [
    {
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        if (editForm.scope === SessionConcurrencyScopeEnum.USER_TYPE && !editForm.userType) {
          callback(new Error("按用户类型生效的策略必须指定合法的用户类型"));
          return;
        }
        callback();
      },
      trigger: "change",
    },
  ],
  maxSessions: [
    {
      required: true,
      type: "number",
      min: 0,
      message: "最大并发会话数不能小于 0",
      trigger: "change",
    },
  ],
};

const privateOnScopeChange = (): void => {
  if (editForm.scope !== SessionConcurrencyScopeEnum.CLIENT) {
    editForm.clientId = "";
  }
  if (editForm.scope !== SessionConcurrencyScopeEnum.USER_TYPE) {
    editForm.userType = "";
  }
};

const buildPayload = (): SessionConcurrencyPolicy => {
  const payload = Object.assign({}, toRaw(editForm));
  if (payload.scope !== SessionConcurrencyScopeEnum.CLIENT) {
    payload.clientId = "";
  }
  if (payload.scope !== SessionConcurrencyScopeEnum.USER_TYPE) {
    payload.userType = "";
  }
  if (!payload.dimension) {
    payload.dimension = SessionConcurrencyDimensionEnum.USER_CLIENT;
  }
  if (!edit.value) {
    payload.id = undefined;
    payload.createdAt = undefined;
    payload.updatedAt = undefined;
  }
  return payload;
};

const privateOnRemoveClick = (): void => {
  if (!hasAction(SecurityAction.CONCURRENCY_UPDATE)) return;
  if (!editForm.id || editForm.scope === SessionConcurrencyScopeEnum.GLOBAL) {
    return;
  }
  confirm.warning("是否删除并发策略?").then(() => {
    DeleteConcurrencyPolicyAPI(editForm.id!).then(() => {
      message.success("删除成功");
      visible.value = false;
      emits("success");
    });
  });
};

const privateOnConfirmClick = (): void => {
  if (!editing.value || !canWrite.value || loading.value) return;
  const form = unref(editFormRef);
  form?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    loading.value = true;
    const payload = buildPayload();
    const request = edit.value
      ? UpdateConcurrencyPolicyAPI(payload)
      : CreateConcurrencyPolicyAPI(payload);

    request
      .then(() => {
        message.success(POLICY_SAVE_MESSAGE);
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
  show(data?: SessionConcurrencyPolicy) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      title.value = "并发策略详情";
      edit.value = true;
      open(true);
      copyParams(editForm, data);
      return;
    }

    title.value = "新建并发策略";
    edit.value = false;
    open(false);
  },
});
</script>

<style lang="postcss" scoped>
.field-tip {
  @apply mt-6px text-13px text-[var(--in-text-color-secondary)];
}
</style>
