<template>
  <in-drawer v-model="visible" title="添加平台成员" :loading="loading" size="520px">
    <in-form label-position="top">
      <el-form-item label="登录名" required>
        <div class="flex gap-8px">
          <el-input v-model="username" clearable placeholder="精确查找已有全局账号" />
          <in-button @click="privateLookup">查找</in-button>
        </div>
      </el-form-item>
      <template v-if="accountId">
        <el-form-item label="头像">
          <in-common-upload-avatar dir="user/avatar" v-model="avatar" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="displayName" clearable placeholder="请输入显示名" />
        </el-form-item>
        <el-form-item label="登录名">
          <el-input :model-value="lookedUpUsername" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :model-value="phone || '-'" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :model-value="email || '-'" disabled />
        </el-form-item>
      </template>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" :disabled="!accountId" @in-click="privateSubmit">
        添加
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Confirm, Message, isApiError } from "@ingot/admin-core";
import { AccountLookupPurpose } from "@ingot/admin-common";
import { PlatformAccountLookupAPI } from "@/api/iam/accounts";
import { PlatformMemberCreateAPI } from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "MemberCreateDrawer" });

const OBJECT_NOT_FOUND = "ObjectNotFound";
const ACCOUNTS_ROUTE = "platform.iam.accounts";

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const go = useGo();
const visible = ref(false);
const loading = ref(false);
const username = ref("");
const accountId = ref("");
const lookedUpUsername = ref("");
const phone = ref("");
const email = ref("");
const displayName = ref("");
const avatar = ref<string | undefined>();

const resetHit = (): void => {
  accountId.value = "";
  lookedUpUsername.value = "";
  phone.value = "";
  email.value = "";
  displayName.value = "";
  avatar.value = undefined;
};

const privateLookup = (): void => {
  const loginName = username.value.trim();
  if (!loginName) {
    Message.warning("请输入登录名");
    return;
  }
  loading.value = true;
  resetHit();
  PlatformAccountLookupAPI({
    purpose: AccountLookupPurpose.MEMBER_CREATE,
    username: loginName,
  })
    .then((response) => {
      const record = response.data.record;
      accountId.value = record.id;
      lookedUpUsername.value = record.username;
      phone.value = record.phone ?? "";
      email.value = record.email ?? "";
      displayName.value = record.username;
      Message.success("已定位账号，不展示组织关系");
    })
    .catch((error: unknown) => {
      if (isApiError(error) && error.code === OBJECT_NOT_FOUND) {
        Confirm.warning("未找到该登录名，是否前往创建全局账号？").then(() => {
          visible.value = false;
          go({ name: ACCOUNTS_ROUTE, query: { username: loginName } });
        });
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateSubmit = (): void => {
  if (!accountId.value) {
    Message.warning("请先查找账号");
    return;
  }
  loading.value = true;
  PlatformMemberCreateAPI({
    accountId: accountId.value,
    displayName: displayName.value.trim() || undefined,
    avatar: avatar.value,
    departments: [],
  })
    .then(() => {
      Message.success("已添加平台成员");
      void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    username.value = "";
    resetHit();
    visible.value = true;
  },
});
</script>
