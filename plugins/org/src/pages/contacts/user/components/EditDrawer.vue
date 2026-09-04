<template>
  <in-drawer :title="title" v-model="show">
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
      <in-button type="primary" @click="handleActionButton">确定</in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import type { UserPageItemVO } from "@/models";
import { UpdateUserAPI, CreateUserAPI } from "@/api/org/user";
import { OrgUserProfileQueryOptions } from "@/api/org/user.query";
import { Message } from "@ingot/admin-core";
import { copyParamsWithKeys, getDiffWithIgnore } from "@ingot/admin-core";
import BizDeptSelect from "@/components/biz/dept-select/BizDeptSelect.vue";
import { useQuery } from "@tanstack/vue-query";

const rawForm = {
  id: undefined,
  deptIds: [],
  nickname: undefined,
  phone: undefined,
  email: undefined,
  avatar: undefined,
  createdAt: undefined,
};

const keys = ["deptIds", "nickname", "phone", "email", "avatar", "createdAt"];

const title = ref("");
const show = ref(false);
const userId = ref();

const rules = {
  deptIds: [{ required: true, message: "请选择部门", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

const emits = defineEmits(["success"]);

const editFormRef = ref();
const editForm = reactive(Object.assign({}, rawForm));
const rawEditForm = Object.assign({}, rawForm);
const saving = ref(false);
const isEdit = ref(false);
const profileQuery = useQuery(() => ({
  ...OrgUserProfileQueryOptions(() => userId.value ?? ""),
  enabled: show.value && isEdit.value && Boolean(userId.value),
}));
const loading = computed(() => profileQuery.isFetching.value || saving.value);

const handleActionButton = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      const params = getDiffWithIgnore(rawEditForm, editForm);
      if (Object.keys(params).length === 0) {
        Message.warning("未改变数据");
        return;
      }
      let request;
      if (isEdit.value) {
        params.id = userId.value;
        request = UpdateUserAPI(params);
      } else {
        request = CreateUserAPI(params);
      }

      saving.value = true;
      request
        .then(() => {
          Message.success("操作成功");
          emits("success");
          show.value = false;
          saving.value = false;
        })
        .catch(() => {
          saving.value = false;
        });
    }
  });
};

watch(
  () => profileQuery.data.value,
  (value) => {
    if (!value) {
      return;
    }
    copyParamsWithKeys(editForm, value, keys);
    copyParamsWithKeys(rawEditForm, value, keys);
  },
);

defineExpose({
  show(data?: UserPageItemVO) {
    isEdit.value = Boolean(data);
    show.value = true;
    nextTick(() => {
      const form = unref(editFormRef);
      form.resetFields();

      if (isEdit.value) {
        title.value = data?.nickname!;
        userId.value = data?.userId!;
      } else {
        title.value = "添加成员";
        userId.value = undefined;
        copyParamsWithKeys(editForm, rawForm, keys);
        copyParamsWithKeys(rawEditForm, rawForm, keys);
      }
    });
  },
});
</script>
