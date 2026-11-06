<template>
  <in-drawer title="添加用户" v-model="visible">
    <in-form ref="FormRef" :model="editForm" :rules="rules">
      <el-form-item label="头像">
        <in-common-upload-avatar dir="user/avatar" v-model="editForm.avatar" />
      </el-form-item>
      <el-form-item label="姓名" prop="nickname">
        <el-input v-model="editForm.nickname" clearable placeholder="请输入姓名"></el-input>
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="editForm.phone" clearable placeholder="请输入手机号"></el-input>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button :disabled="loading" @click="visible = false">取消</in-button>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick">添加</in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import type { MemberUserDTO } from "@/models";
import { copyParams, useCapabilities } from "@ingot/admin-core";
import { CreateUserAPI } from "@/api/member/user";
import { MemberAction } from "@/models/actions";

const defaultEditForm: MemberUserDTO = {
  phone: undefined,
  nickname: undefined,
  avatar: undefined,
};

const emits = defineEmits<{ success: [] }>();
const { hasAction } = useCapabilities();

const visible = ref(false);
const loading = ref(false);
const editForm = reactive(Object.assign({}, defaultEditForm));
const FormRef = ref();
const message = useMessage();

const rules = {
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入姓名", trigger: "blur" }],
};

const show = () => {
  visible.value = true;
  copyParams(editForm, defaultEditForm);
  nextTick(() => {
    const form = unref(FormRef);
    form.clearValidate();
  });
};

const handleConfirmClick = () => {
  const form = unref(FormRef);
  form.validate((valid: boolean) => {
    if (valid && hasAction(MemberAction.USER_CREATE) && !loading.value) {
      loading.value = true;
      CreateUserAPI(editForm)
        .then(() => {
          loading.value = false;
          visible.value = false;
          message.success("操作成功");
          emits("success");
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};
defineExpose({
  show,
});
</script>
