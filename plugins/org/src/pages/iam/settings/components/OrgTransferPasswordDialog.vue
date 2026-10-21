<template>
  <in-dialog v-model="visible" title="验证登录密码" width="480px" append-to-body>
    <p class="org-transfer-password__hint">
      将把组织所有权转交给 {{ memberName }}。转交后当前账号失去组织所有权，已有普通角色保留。
    </p>
    <el-input
      v-model="secret"
      type="password"
      show-password
      autocomplete="current-password"
      placeholder="请输入登录密码"
      @keyup.enter="privateOnConfirm"
    />
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :disabled="!secret" :loading="saving" @click="privateOnConfirm">
        确认转交
      </in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { isApiError, Message } from "@ingot/admin-core";
import { IamReasonCode, SensitiveConfirmationKind } from "@ingot/admin-common";
import { TenantOwnerTransferAPI } from "@/api/iam/directory";

defineOptions({ name: "OrgTransferPasswordDialog" });

const emit = defineEmits<{
  transferred: [];
}>();

const visible = ref(false);
const saving = ref(false);
const version = ref("");
const memberId = ref("");
const memberName = ref("");
const secret = ref("");

const show = (member: { id: string; name: string }, expectedVersion: string): void => {
  version.value = expectedVersion;
  memberId.value = member.id;
  memberName.value = member.name;
  secret.value = "";
  visible.value = true;
};

const privateOnConfirm = (): void => {
  const password = secret.value;
  if (!password || saving.value) {
    return;
  }
  saving.value = true;
  TenantOwnerTransferAPI({
    expectedVersion: version.value,
    newOwnerMemberId: memberId.value,
    confirmation: { kind: SensitiveConfirmationKind.LOGIN_PASSWORD, secret: password },
  })
    .then(() => {
      visible.value = false;
      secret.value = "";
      Message.success("所有者已转交");
      emit("transferred");
    })
    .catch((error: unknown) => {
      if (isApiError(error) && error.code === IamReasonCode.STEP_UP_FAILED) {
        secret.value = "";
        Message.warning("登录密码不正确");
        return;
      }
      if (isApiError(error)) {
        Message.warning(error.message);
      }
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({ show });
</script>

<style scoped lang="postcss">
.org-transfer-password__hint {
  margin: 0 0 var(--in-space-4);
  color: var(--in-text-color-secondary);
  line-height: var(--in-line-height-body);
}
</style>
