<template>
  <in-drawer v-model="visible" title="添加平台成员" :loading="loading" size="520px">
    <in-form label-position="top">
      <el-form-item label="登录名" required>
        <div class="flex gap-8px">
          <el-input v-model="username" clearable placeholder="精确查找已有全局账号" />
          <in-button @click="privateLookup">查找</in-button>
        </div>
      </el-form-item>
      <el-form-item v-if="accountId" label="账号 ID">
        <span>{{ accountId }}</span>
      </el-form-item>
      <el-form-item label="显示名">
        <el-input v-model="displayName" clearable />
      </el-form-item>
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
import { Message } from "@ingot/admin-core";
import { AccountLookupPurpose } from "@ingot/admin-common";
import { PlatformAccountLookupAPI } from "@/api/iam/accounts";
import { PlatformMemberCreateAPI } from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "MemberCreateDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const username = ref("");
const accountId = ref("");
const displayName = ref("");

const privateLookup = (): void => {
  if (!username.value.trim()) {
    Message.warning("请输入登录名");
    return;
  }
  loading.value = true;
  PlatformAccountLookupAPI({
    purpose: AccountLookupPurpose.MEMBER_CREATE,
    username: username.value.trim(),
  })
    .then((response) => {
      accountId.value = response.data.record.id;
      Message.success("已定位账号，不展示组织关系");
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
    accountId.value = "";
    displayName.value = "";
    visible.value = true;
  },
});
</script>
