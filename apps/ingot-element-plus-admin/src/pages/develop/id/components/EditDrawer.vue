<template>
  <in-drawer :title="title" v-model="visible">
    <in-form ref="editFormRef" :model="editForm" :rules="rules">
      <el-form-item label="业务标签" prop="bizTag">
        <el-input
          v-model="editForm.bizTag"
          :disabled="edit"
          clearable
          placeholder="请输入业务标签"
        ></el-input>
      </el-form-item>
      <el-form-item label="初始化ID" prop="maxId">
        <el-input v-model="editForm.maxId" clearable placeholder="请输入初始化ID"></el-input>
      </el-form-item>
      <el-form-item label="ID步长" prop="step">
        <el-input v-model="editForm.step" clearable placeholder="请输入ID步长"></el-input>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="editForm.description" clearable placeholder="请输入描述"></el-input>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button v-if="edit" type="danger" @click="handleRemoveClick"> 删除 </in-button>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import type { BizLeafAlloc } from "@/models";
import { copyParams, getDiffWithIgnore } from "@/utils/object";
import { CreateIdAPI, UpdateIdAPI, RemoveIdAPI } from "@/api/basic/id";

const rules = {
  bizTag: [{ required: true, message: "请输入业务标签", trigger: "blur" }],
  maxId: [{ required: true, message: "请输入初始化ID", trigger: "blur" }],
  step: [{ required: true, message: "请输入ID步长", trigger: "blur" }],
};

const defaultEditForm: BizLeafAlloc = {
  bizTag: undefined,
  maxId: undefined,
  step: undefined,
  description: undefined,
  updateTime: undefined,
};

const emits = defineEmits(["success"]);

const editFormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm = reactive(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);

const message = useMessage();
const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveIdAPI), () => {
  visible.value = false;
  emits("success");
});

const handleRemoveClick = () => {
  confirmDelete.exec(editForm.bizTag!, `是否删除ID(${editForm.bizTag})`, "删除成功");
};

const handleConfirmClick = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      let request;
      if (edit.value) {
        const params = getDiffWithIgnore(rawForm, editForm);
        if (Object.keys(params).length === 0) {
          message.warning("未改变数据");
          return;
        }
        params.bizTag = editForm.bizTag;
        request = UpdateIdAPI(params);
      } else {
        request = CreateIdAPI(Object.assign({}, toRaw(editForm)));
      }

      request
        .then(() => {
          loading.value = false;
          message.success("操作成功");
          visible.value = false;
          emits("success");
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};

defineExpose({
  show(data?: BizLeafAlloc) {
    visible.value = true;

    // 重置数据
    copyParams(editForm, defaultEditForm);
    copyParams(rawForm, defaultEditForm);
    nextTick(() => {
      const form = unref(editFormRef);
      form.clearValidate();
    });

    if (data) {
      title.value = "编辑业务ID";
      edit.value = true;
      copyParams(editForm, data);
      copyParams(rawForm, data);
    } else {
      title.value = "添加业务ID";
      edit.value = false;
    }
  },
});
</script>
