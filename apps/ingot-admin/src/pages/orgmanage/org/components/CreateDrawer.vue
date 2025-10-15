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
      <el-form-item label="Logo" prop="avatar">
        <in-common-upload-avatar dir="user/avatar" v-model="editForm.avatar" />
      </el-form-item>
      <el-form-item label="组织名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入组织名称"></el-input>
      </el-form-item>
      <el-form-item label="管理员手机号" prop="phone">
        <BizSearchUserByPhone v-model="editForm.phone" clearable placeholder="请输入管理员手机号" />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button type="primary" @click="handleActionButton">确定</in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import BizSearchUserByPhone from "@/components/biz/search-user-by-phone/BizSearchUserByPhone.vue";
import { useTenantStore } from "@/stores/modules/tenant";
import { Message } from "@/utils/message";
import { copyParamsWithKeys } from "@/utils/object";

const rawForm = {
  avatar: undefined,
  name: undefined,
  phone: undefined,
};

const keys = ["avatar", "name", "phone"];

const title = ref("");
const show = ref(false);

const rules = {
  avatar: [{ required: true, message: "请上传logo", trigger: "blur" }],
  name: [{ required: true, message: "请输入组织", trigger: "blur" }],
  phone: [{ required: true, message: "请输入管理员手机号", trigger: "blur" }],
};

const emits = defineEmits(["success"]);

const tenantStore = useTenantStore();

const editFormRef = ref();
const editForm = reactive(Object.assign({}, rawForm));
const rawEditForm = Object.assign({}, rawForm);
const loading = ref(false);

const handleActionButton = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      tenantStore
        .createTenant(editForm)
        .then(() => {
          Message.success("操作成功");
          emits("success");
          loading.value = false;
          show.value = false;
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};

defineExpose({
  show() {
    show.value = true;
    nextTick(() => {
      const form = unref(editFormRef);
      form.resetFields();
      title.value = "添加组织";
      copyParamsWithKeys(editForm, rawForm, keys);
      copyParamsWithKeys(rawEditForm, rawForm, keys);
    });
  },
});
</script>
