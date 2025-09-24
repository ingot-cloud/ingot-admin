<template>
  <div>
    <in-form-group-title title="个人基本信息" v-model="editFlag" />
    <div p-20px>
      <in-form ref="FormRef" :model="editForm" :rules="rules" :disabled="!editFlag">
        <el-form-item label="头像">
          <in-common-upload-avatar :dir="uploadDir" v-model="editForm.avatar" />
        </el-form-item>
        <el-form-item label="姓名" prop="nickname">
          <el-input v-model="editForm.nickname" clearable placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" clearable placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="email" prop="email">
          <el-input v-model="editForm.email" clearable placeholder="请输入email"></el-input>
        </el-form-item>
      </in-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { UserDTO, UserProfileVO } from "@/models";
import { copyParamsWithKeys, getDiffWithIgnore } from "@/utils/object";

const defaultEditForm: UserDTO = {
  phone: undefined,
  nickname: undefined,
  email: undefined,
  avatar: undefined,
};
const keys = ["phone", "nickname", "email", "avatar"];

const rules = {
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入姓名", trigger: "blur" }],
};

const userId = ref("");
const uploadDir = ref("");
const editFlag = ref(false);
const FormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm = reactive(Object.assign({}, defaultEditForm));

defineExpose({
  init() {
    editFlag.value = false;
  },
  setData(id: string, params: UserProfileVO) {
    userId.value = id;
    uploadDir.value = `user/avatar/${userId.value}`;
    copyParamsWithKeys(editForm, params, keys);
    copyParamsWithKeys(rawForm, params, keys);
    nextTick(() => {
      const form = unref(FormRef);
      form.clearValidate();
    });
  },
  getData() {
    return new Promise<UserDTO>((resolve, reject) => {
      if (!editFlag.value) {
        reject();
        return;
      }

      const result = getDiffWithIgnore(rawForm, editForm);
      if (Object.keys(result).length === 0) {
        reject();
        return;
      }
      result.id = userId.value;
      FormRef.value.validate((valid: boolean) => {
        if (valid) {
          editFlag.value = false;
          resolve(result);
        }
      });
    });
  },
});
</script>
<style scoped lang="postcss"></style>
