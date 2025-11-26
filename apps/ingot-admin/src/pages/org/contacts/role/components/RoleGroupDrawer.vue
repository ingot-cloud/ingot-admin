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
      <el-form-item label="角色组名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入角色组名称"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button type="primary" @click="handleActionButton">确定</in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import type { RoleTreeNodeVO } from "@/models";
import { RoleTypeEnums } from "@/models/enums";
import { useRoleStore } from "@/stores/modules/org/role";
import { Message } from "@/utils/message";
import { copyParamsWithKeys, getDiffWithIgnore } from "@/utils/object";

const rawForm = {
  id: undefined,
  name: undefined,
  type: RoleTypeEnums.GROUP,
};

const keys = ["id", "name", "type"];

const title = ref("");
const show = ref(false);
const id = ref();

const rules = {
  name: [{ required: true, message: "请输入角色组名称", trigger: "blur" }],
};

const emits = defineEmits(["success"]);

const roleStore = useRoleStore();

const editFormRef = ref();
const editForm = reactive(Object.assign({}, rawForm));
const rawEditForm = Object.assign({}, rawForm);
const loading = ref(false);
const isEdit = ref(false);

const handleActionButton = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      const params = getDiffWithIgnore(rawEditForm, editForm);
      if (Object.keys(params).length === 0) {
        Message.warning("未改变数据");
        return;
      }
      params.type = RoleTypeEnums.GROUP;

      let request;
      if (isEdit.value) {
        params.id = id.value;
        request = roleStore.updateRole(params);
      } else {
        request = roleStore.createRole(params);
      }

      loading.value = true;
      request
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
  show(data?: RoleTreeNodeVO) {
    isEdit.value = Boolean(data);
    show.value = true;
    nextTick(() => {
      const form = unref(editFormRef);
      form.resetFields();

      if (isEdit.value) {
        title.value = "编辑角色组";
        id.value = data?.id!;
        copyParamsWithKeys(editForm, data!, keys);
        copyParamsWithKeys(rawEditForm, data!, keys);
      } else {
        title.value = "新增角色组";
        copyParamsWithKeys(editForm, rawForm, keys);
        copyParamsWithKeys(rawEditForm, rawForm, keys);
      }
    });
  },
});
</script>
