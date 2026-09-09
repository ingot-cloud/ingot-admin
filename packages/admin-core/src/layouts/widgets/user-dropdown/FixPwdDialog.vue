<template>
  <in-dialog title="修改密码" v-model="visible" width="480" append-to-body>
    <el-form ref="EditFormRef" label-width="96px" :model="editForm" :rules="rules">
      <el-form-item prop="password" label="原始密码">
        <el-input
          v-model="editForm.password"
          placeholder="请输入密码"
          type="password"
          clearable
          show-password
        ></el-input>
      </el-form-item>
      <el-form-item prop="newPassword" label="新密码">
        <el-input
          v-model="editForm.newPassword"
          placeholder="请输入新密码"
          type="password"
          clearable
          show-password
        ></el-input>
      </el-form-item>
      <el-form-item prop="confirmPassword" label="确认新密码">
        <el-input
          v-model="editForm.confirmPassword"
          placeholder="请确认新密码"
          type="password"
          clearable
          show-password
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button :loading="loading" type="primary" @click="privateOnConfirm">确定</in-button>
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { FixPasswordAPI } from "@/api/common/password";
import { Message } from "@/utils/message";

defineOptions({
  name: "FixPwdDialog",
});

interface EditForm {
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const rules: FormRules<EditForm> = {
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [{ required: true, message: "请确认新密码", trigger: "blur" }],
};

const visible = ref(false);
const loading = ref(false);
const EditFormRef = ref<FormInstance>();
const editForm = reactive<EditForm>({});

const privateOnConfirm = async () => {
  const form = EditFormRef.value;
  if (!form) {
    return;
  }
  try {
    await form.validate();
  } catch {
    return;
  }
  if (editForm.newPassword !== editForm.confirmPassword) {
    Message.warning("新密码不一致");
    return;
  }
  loading.value = true;
  try {
    await FixPasswordAPI({
      password: editForm.password,
      newPassword: editForm.newPassword,
    });
    Message.success("操作成功");
    visible.value = false;
  } finally {
    loading.value = false;
  }
};

defineExpose({
  show() {
    visible.value = true;
    nextTick(() => {
      EditFormRef.value?.resetFields();
    });
  },
});
</script>
