<template>
  <in-drawer title="修改密码" v-model="visible">
    <el-form ref="EditFormRef" class="form" label-width="80px" :model="editForm" :rules="rules">
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
      <el-form-item prop="confirmPassword" label="确认密码">
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
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { FixPasswordAPI } from "@/api/org/user";
import { Message } from "@/utils/message";

const rules = {
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [{ required: true, message: "请确认新密码", trigger: "blur" }],
};

interface EditForm {
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const visible = ref(false);
const loading = ref(false);
const EditFormRef = ref();
const editForm = reactive<EditForm>({});

const handleConfirmClick = () => {
  EditFormRef.value.validate((valid: boolean) => {
    if (valid) {
      if (editForm.newPassword !== editForm.confirmPassword) {
        Message.warning("新密码不一致");
        return;
      }

      loading.value = true;
      FixPasswordAPI({
        password: editForm.password,
        newPassword: editForm.newPassword,
      })
        .then(() => {
          loading.value = false;
          Message.success("操作成功");
          visible.value = false;
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};

defineExpose({
  show() {
    visible.value = true;
    nextTick(() => {
      const form = unref(EditFormRef);
      form.resetFields();
    });
  },
});
</script>
