<template>
  <in-drawer :title="user.nickname" v-model="visible" padding="0" :loading="loading">
    <in-form-group-title title="个人基本信息" v-model="editFlag" />
    <div p-20px>
      <in-form ref="FormRef" :model="editForm" :rules="rules" :disabled="!editFlag">
        <el-form-item label="头像">
          <in-common-upload-avatar dir="user/avatar" v-model="editForm.avatar" />
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
        <el-form-item label="权限">
          <div flex flex-wrap gap-2 flex-row v-if="editForm.roles!.length > 0">
            <in-tag
              v-for="role in editForm.roles!"
              :key="role.id"
              :value="{ text: role.name!, tag: 'info' }"
            />
          </div>
          <in-tag v-else :value="{ text: '暂无角色', tag: 'info' }"></in-tag>
        </el-form-item>
      </in-form>
    </div>
    <template #footer>
      <div>
        <in-button @click="visible = false">取消</in-button>
        <in-button type="success" @click="handleBindCommand">编辑角色</in-button>
        <in-button type="danger" @click="handleRemoveClick">删除</in-button>
        <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
      </div>
    </template>
  </in-drawer>
  <BindRoleDialog ref="bindRoleDialogRef" @success="fetchData" />
</template>
<script lang="ts" setup>
import type { MemberUser, MemberUserProfileVO } from "@/models";
import { RemoveUserAPI, UserProfileAPI, UpdateUserAPI } from "@/api/platform/member/user";
import { copyParamsWithKeys, getDiffWithIgnore } from "@/utils/object";
import BindRoleDialog from "./BindRoleDialog.vue";

const defaultEditForm: MemberUserProfileVO = {
  phone: undefined,
  nickname: undefined,
  email: undefined,
  avatar: undefined,
  roles: [],
};
const keys = ["phone", "nickname", "email", "avatar", "roles"];

const emits = defineEmits(["success"]);

const bindRoleDialogRef = ref();

const user = ref<MemberUser>({});
const visible = ref(false);
const loading = ref(false);
const editFlag = ref(false);
const FormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm = reactive(Object.assign({}, defaultEditForm));

const rules = {
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  nickname: [{ required: true, message: "请输入姓名", trigger: "blur" }],
};

const message = useMessage();
const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveUserAPI), () => {
  visible.value = false;
  emits("success");
});

const handleBindCommand = (): void => {
  bindRoleDialogRef.value.show(
    user.value.id!,
    editForm.nickname,
    editForm.roles?.map((role) => role.id!) ?? [],
  );
};

const handleConfirmClick = () => {
  if (!editFlag.value) {
    return;
  }

  FormRef.value.validate((valid: boolean) => {
    if (!valid) {
      editFlag.value = false;
      return;
    }

    const result = getDiffWithIgnore(rawForm, editForm);
    if (Object.keys(result).length === 0) {
      message.warning("数据未修改");
      return;
    }
    result.id = user.value.id!;

    loading.value = true;
    UpdateUserAPI(result)
      .then(() => {
        loading.value = false;
        visible.value = false;
        message.success("操作成功");
        emits("success");
      })
      .catch(() => {
        loading.value = false;
      });
  });
};

const handleRemoveClick = () => {
  confirmDelete.exec(user.value.id!, `是否删除用户(${user.value.nickname})`, "删除成功");
};

const fetchData = () => {
  loading.value = true;
  UserProfileAPI(user.value.id!)
    .then((response) => {
      loading.value = false;
      copyParamsWithKeys(editForm, response.data, keys);
      copyParamsWithKeys(rawForm, response.data, keys);
    })
    .catch(() => {
      loading.value = false;
    });
};

defineExpose({
  show(params: MemberUser) {
    user.value = params;
    visible.value = true;
    editFlag.value = false;
    copyParamsWithKeys(editForm, defaultEditForm, keys);
    copyParamsWithKeys(rawForm, defaultEditForm, keys);
    nextTick(() => {
      const form = unref(FormRef);
      form.clearValidate();
    });

    fetchData();
  },
});
</script>
