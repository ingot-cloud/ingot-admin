<template>
  <in-drawer v-model="visible" title="创建全局账号" :loading="loading" size="480px">
    <in-form label-position="top" :model="draft">
      <el-form-item label="登录名" required>
        <el-input v-model="draft.username" clearable placeholder="不自动授予任何成员资格" />
      </el-form-item>
      <el-form-item label="登录手机号">
        <el-input v-model="draft.phone" clearable placeholder="可空" />
      </el-form-item>
      <el-form-item label="登录邮箱">
        <el-input v-model="draft.email" clearable placeholder="可空" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">创建</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { PlatformAccountCreateAPI } from "@/api/iam/accounts";
import { platformAccountQueryKeys } from "@/api/iam/accounts.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "AccountCreateDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const draft = reactive({
  username: "",
  phone: "",
  email: "",
});

const reset = (): void => {
  draft.username = "";
  draft.phone = "";
  draft.email = "";
};

const privateSubmit = (): void => {
  if (!draft.username.trim()) {
    Message.warning("请输入登录名");
    return;
  }
  loading.value = true;
  PlatformAccountCreateAPI({
    username: draft.username.trim(),
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim() || undefined,
  })
    .then(() => {
      Message.success("创建成功，初始口令不会回显，如需登录请重置密码");
      void queryClient.invalidateQueries({ queryKey: platformAccountQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    reset();
    visible.value = true;
  },
});
</script>
