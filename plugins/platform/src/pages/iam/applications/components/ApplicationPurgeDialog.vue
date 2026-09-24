<template>
  <in-dialog v-model="visible" title="强制清除应用" width="520px" layout="pinned" append-to-body>
    <div class="flex flex-col gap-[var(--in-space-3)]">
      <p>{{ reason }}</p>
      <p class="text-[var(--el-color-danger)]">
        此操作不可恢复，将清除该应用的全部关联，包括授权、菜单、人群、组织开通与套餐引用。
      </p>
      <el-input
        v-model="secret"
        type="password"
        show-password
        placeholder="请输入登录密码"
        autocomplete="current-password"
        @keyup.enter="privateOnConfirm"
      />
    </div>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="danger" :loading="submitting" :disabled="!secret" @click="privateOnConfirm">
        强制清除
      </in-button>
    </template>
  </in-dialog>
</template>

<script lang="ts" setup>
import { isApiError, Message } from "@ingot/admin-core";
import { IamReasonCode, SensitiveConfirmationKind } from "@ingot/admin-common";
import { PlatformApplicationPurgeAPI } from "@/api/iam/catalog";
import type { Row } from "../table";

defineOptions({ name: "ApplicationPurgeDialog" });

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const submitting = ref(false);
const reason = ref("");
const secret = ref("");
const target = ref<Row>();

const privateOnConfirm = (): void => {
  const item = target.value;
  if (!item || !secret.value || submitting.value) {
    return;
  }
  submitting.value = true;
  PlatformApplicationPurgeAPI(item.record.id, {
    expectedVersion: item.version,
    confirmation: {
      kind: SensitiveConfirmationKind.LOGIN_PASSWORD,
      secret: secret.value,
    },
  })
    .then(() => {
      Message.success("已强制清除");
      visible.value = false;
      secret.value = "";
      emit("success");
    })
    .catch((error: unknown) => {
      if (isApiError(error) && error.code === IamReasonCode.STEP_UP_FAILED) {
        Message.warning(error.message);
        return;
      }
      if (isApiError(error)) {
        Message.warning(error.message);
      }
    })
    .finally(() => {
      submitting.value = false;
    });
};

defineExpose({
  show(item: Row, message: string) {
    target.value = item;
    reason.value = message;
    secret.value = "";
    visible.value = true;
  },
});
</script>
