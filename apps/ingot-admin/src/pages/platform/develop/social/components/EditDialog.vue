<template>
  <in-drawer :title="title" v-model="visible">
    <in-form ref="editFormRef" :model="editForm" :rules="rules">
      <el-form-item label="AppID" prop="appId">
        <el-input v-model="editForm.appId" clearable placeholder="请输入AppID"></el-input>
      </el-form-item>
      <el-form-item label="AppSecret" prop="appSecret">
        <el-input v-model="editForm.appSecret" clearable placeholder="请输入AppSecret"></el-input>
      </el-form-item>
      <el-form-item label="社交类型" prop="type">
        <in-select w-full v-model="editForm.type" :options="socialTypeEnumsEnum.getOptions()" />
      </el-form-item>
      <el-form-item label="社交名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入社交名称"></el-input>
      </el-form-item>
      <el-form-item label="重定向URL">
        <el-input v-model="editForm.redirectUrl" clearable placeholder="请输入重定向URL"></el-input>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts">
import type { SysSocialDetails as P } from "@/models";
export interface API {
  show(data?: P): void;
}
</script>
<script lang="ts" setup>
import type { SysSocialDetails } from "@/models";
import { useSocialTypeEnumsEnum } from "@/models/enums";
import { Message } from "@/utils/message";
import { copyParams, getDiff } from "@/utils/object";
import { CreateSocialAPI, UpdateSocialAPI } from "@/api/platform/dev/social";

const rules = {
  appId: [{ required: true, message: "请输入AppID", trigger: "blur" }],
  appSecret: [{ required: true, message: "请输入AppSecret", trigger: "blur" }],
  type: [{ required: true, message: "请选择社交类型", trigger: "blur" }],
  name: [{ required: true, message: "请输入社交名称", trigger: "blur" }],
};

const defaultEditForm: SysSocialDetails = {
  id: undefined,
  appId: undefined,
  appSecret: undefined,
  redirectUrl: undefined,
  name: undefined,
  type: undefined,
  status: undefined,
};

const emits = defineEmits(["success"]);

const socialTypeEnumsEnum = useSocialTypeEnumsEnum();
const editFormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm = reactive(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);

const show = (data?: SysSocialDetails) => {
  visible.value = true;

  // 重置数据
  copyParams(editForm, defaultEditForm);
  copyParams(rawForm, defaultEditForm);
  nextTick(() => {
    const form = unref(editFormRef);
    form.clearValidate();
  });

  if (data) {
    title.value = "编辑";
    edit.value = true;
    copyParams(editForm, data);
    copyParams(rawForm, data);
  } else {
    title.value = "创建";
    edit.value = false;
  }
};
const handleConfirmClick = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      let request;
      if (edit.value) {
        const params = getDiff<SysSocialDetails>(rawForm, editForm);
        if (Object.keys(params).length === 0) {
          Message.warning("未改变数据");
          return;
        }
        params.id = rawForm.id;
        request = UpdateSocialAPI(params);
      } else {
        request = CreateSocialAPI(Object.assign({}, toRaw(editForm)));
      }

      request
        .then(() => {
          loading.value = false;
          Message.success("操作成功");
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
  show,
});
</script>
