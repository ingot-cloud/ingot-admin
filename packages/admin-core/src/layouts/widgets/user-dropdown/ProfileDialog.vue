<template>
  <in-dialog title="个人资料" v-model="visible" width="480" append-to-body>
    <el-form v-if="profile" label-width="96px">
      <el-form-item label="登录名">
        <span>{{ profile.username }}</span>
      </el-form-item>
      <el-form-item label="显示名">
        <span>{{ profile.member.displayName }}</span>
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="draft.phone" clearable />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="draft.email" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @click="privateOnConfirm">保存</in-button>
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
import { IamProfileAPI, IamProfileUpdateAPI } from "@/api/common/iam";
import { Message } from "@/utils/message";
import type { AccountSelfProfile } from "@/models/iam";

defineOptions({
  name: "ProfileDialog",
});

const visible = ref(false);
const loading = ref(false);
const profile = ref<AccountSelfProfile>();
const draft = reactive({ phone: "", email: "" });

const load = (): void => {
  loading.value = true;
  IamProfileAPI()
    .then((response) => {
      profile.value = response.data;
      draft.phone = response.data.phone ?? "";
      draft.email = response.data.email ?? "";
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateOnConfirm = (): void => {
  if (!profile.value) {
    return;
  }
  loading.value = true;
  IamProfileUpdateAPI({
    expectedVersion: profile.value.version,
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim() || undefined,
  })
    .then((response) => {
      profile.value = response.data;
      draft.phone = response.data.phone ?? "";
      draft.email = response.data.email ?? "";
      Message.success("保存成功");
      visible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    visible.value = true;
    load();
  },
});
</script>
