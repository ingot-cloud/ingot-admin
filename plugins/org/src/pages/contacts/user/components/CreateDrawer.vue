<template>
  <in-drawer title="添加成员" v-model="show">
    <el-form
      v-loading="loading"
      ref="editFormRef"
      label-width="100px"
      label-position="top"
      :model="editForm"
      :rules="rules"
    >
      <el-form-item label="头像">
        <in-common-upload-avatar dir="user/avatar" v-model="editForm.avatar" />
      </el-form-item>

      <el-form-item label="名称" prop="nickname">
        <el-input v-model="editForm.nickname" clearable placeholder="请输入名称"></el-input>
      </el-form-item>

      <el-form-item label="部门" prop="deptIds">
        <BizDeptSelect w-full multiple v-model="editForm.deptIds" clearable />
      </el-form-item>

      <el-form-item label="手机号" prop="phone">
        <el-input v-model="editForm.phone" clearable placeholder="请输入手机号"></el-input>
      </el-form-item>

      <el-form-item label="email" prop="email">
        <el-input v-model="editForm.email" clearable placeholder="请输入email"></el-input>
      </el-form-item>
    </el-form>
    <div class="text-sm text-gray-500 color-red">*默认密码和手机号相同，请登录自行修改</div>
    <template #footer>
      <in-button type="primary" @click="privateOnSubmit">确定</in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { CreateUserAPI } from "@/api/org/user";
import { Message } from "@ingot/admin-core";
import { copyParamsWithKeys, getDiffWithIgnore } from "@ingot/admin-core";
import BizDeptSelect from "@/components/biz/dept-select/BizDeptSelect.vue";

const rawForm = {
  deptIds: [] as Array<string>,
  nickname: undefined as string | undefined,
  phone: undefined as string | undefined,
  email: undefined as string | undefined,
  avatar: undefined as string | undefined,
};

const keys = ["deptIds", "nickname", "phone", "email", "avatar"];

const show = ref(false);
const loading = ref(false);

const rules = {
  deptIds: [{ required: true, message: "请选择部门", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

const emits = defineEmits<{
  success: [];
}>();

const editFormRef = ref();
const editForm = reactive({ ...rawForm, deptIds: [] as Array<string> });
const rawEditForm = { ...rawForm, deptIds: [] as Array<string> };

const privateReset = (): void => {
  copyParamsWithKeys(editForm, rawForm, keys);
  copyParamsWithKeys(rawEditForm, rawForm, keys);
  editForm.deptIds = [];
  rawEditForm.deptIds = [];
};

const privateOnSubmit = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    const params = getDiffWithIgnore(rawEditForm, editForm);
    if (Object.keys(params).length === 0) {
      Message.warning("未改变数据");
      return;
    }
    loading.value = true;
    CreateUserAPI(params)
      .then(() => {
        Message.success("操作成功");
        emits("success");
        show.value = false;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  });
};

defineExpose({
  show() {
    show.value = true;
    nextTick(() => {
      const form = unref(editFormRef);
      form.resetFields();
      privateReset();
    });
  },
});
</script>
