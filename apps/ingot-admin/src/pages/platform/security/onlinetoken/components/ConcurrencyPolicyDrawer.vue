<template>
  <in-drawer :title="title" v-model="visible">
    <in-form ref="editFormRef" :model="editForm" :rules="rules">
      <el-form-item label="生效范围" prop="scope">
        <in-select
          v-model="editForm.scope"
          :options="scopeEnum.getOptions()"
          placeholder="请选择生效范围"
          @change="privateOnScopeChange"
        />
      </el-form-item>
      <el-form-item
        v-if="editForm.scope === SessionConcurrencyScopeEnum.CLIENT"
        label="客户端"
        prop="clientId"
      >
        <ClientIdField v-model="editForm.clientId" />
      </el-form-item>
      <el-form-item
        v-if="editForm.scope === SessionConcurrencyScopeEnum.USER_TYPE"
        label="用户类型"
        prop="userType"
      >
        <in-select
          v-model="editForm.userType"
          :options="userTypeEnum.getOptions()"
          placeholder="请选择用户类型"
        />
      </el-form-item>
      <el-form-item label="最大会话数" prop="maxSessions">
        <el-input-number v-model="editForm.maxSessions" :min="0" class="w-full" />
        <div class="field-tip">0 表示不限制</div>
      </el-form-item>
      <el-form-item label="超出处置" prop="overflow">
        <in-select
          v-model="editForm.overflow"
          :options="overflowEnum.getOptions()"
          placeholder="请选择超出处置"
        />
      </el-form-item>
      <el-form-item label="管理用户单会话">
        <el-switch
          v-model="editForm.adminForbidConcurrent"
          inline-prompt
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>
      <el-form-item label="是否启用">
        <el-switch v-model="editForm.enabled" inline-prompt active-text="是" inactive-text="否" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="editForm.remark"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="请输入备注"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button
        v-if="edit && editForm.scope !== SessionConcurrencyScopeEnum.GLOBAL"
        type="danger"
        @click="privateOnRemoveClick"
      >
        删除
      </in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirmClick">确定</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { SessionConcurrencyPolicy } from "@/models";
import {
  SessionConcurrencyDimensionEnum,
  SessionConcurrencyOverflowEnum,
  SessionConcurrencyScopeEnum,
  useSessionConcurrencyOverflowEnum,
  useSessionConcurrencyScopeEnum,
  useSessionUserTypeEnum,
} from "@/models/enums";
import { copyParams } from "@/utils/object";
import {
  CreateConcurrencyPolicyAPI,
  DeleteConcurrencyPolicyAPI,
  UpdateConcurrencyPolicyAPI,
} from "@/api/platform/security/concurrencyPolicy";
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

const editFormRef = ref();
const editForm = reactive<SessionConcurrencyPolicy>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);
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
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
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
      title.value = "编辑并发策略";
      edit.value = true;
      copyParams(editForm, data);
      return;
    }

    title.value = "新建并发策略";
    edit.value = false;
  },
});
</script>

<style lang="postcss" scoped>
.field-tip {
  @apply mt-6px text-13px text-[var(--in-text-color-secondary)];
}
</style>
