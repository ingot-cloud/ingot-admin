<template>
  <in-drawer :title="title" v-model="visible" width="480px">
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
      <el-form-item label="资源编码" prop="code">
        <el-input
          v-model="editForm.code"
          :disabled="edit"
          clearable
          placeholder="如 demo-order，创建后不可修改"
          maxlength="64"
        />
      </el-form-item>
      <el-form-item label="资源名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入资源名称" maxlength="64" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="editForm.status">
          <el-radio-button v-for="item in statusEnum.getOptions()" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirm">确定</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { AppResourceCreateDTO, PlatformResource } from "@/models";
import { CommonStatus, CommonStatusEnumExtArray } from "@/models/enums";
import {
  CreateAppResourceAPI,
  UpdateAppResourceAPI,
} from "@/api/platform/config/app";
import { appQueryKeys } from "@/api/platform/config/app.query";
import { copyParams, getDiffWithIgnore, invalidateQueriesByKeys, silentQueryRequest } from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const props = defineProps<{
  appId: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const statusEnum = useEnum(CommonStatusEnumExtArray);
const defaultEditForm: AppResourceCreateDTO & { id?: string } = {
  code: undefined,
  name: undefined,
  status: CommonStatus.Enable,
};

const rules = {
  code: [
    { required: true, message: "请输入资源编码", trigger: "blur" },
    { pattern: /^[a-z][a-z0-9:.\-_]*$/, message: "编码格式不正确", trigger: "blur" },
  ],
  name: [{ required: true, message: "请输入资源名称", trigger: "blur" }],
};

const editFormRef = ref();
const editForm = reactive({ ...defaultEditForm });
const rawForm = reactive({ ...defaultEditForm });
const title = ref("");
const edit = ref(false);
const visible = ref(false);
const message = useMessage();
const queryClient = useQueryClient();

const saveMutation = useMutation({
  mutationFn: (request: Promise<unknown>) => request,
  onSuccess: () =>
    invalidateQueriesByKeys(queryClient, [
      appQueryKeys.resources(props.appId),
      appQueryKeys.permissions(props.appId),
    ]),
});

const loading = computed(() => saveMutation.isPending.value);

const privateOnConfirm = (): void => {
  unref(editFormRef)?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    if (edit.value) {
      const diff = getDiffWithIgnore(rawForm, editForm, ["name", "status"]);
      if (Object.keys(diff).length === 0) {
        message.warning("未改变数据");
        return;
      }
      saveMutation
        .mutateAsync(UpdateAppResourceAPI(props.appId, rawForm.id!, diff, silentQueryRequest()))
        .then(() => {
          message.success("操作成功");
          visible.value = false;
          emit("success");
        });
      return;
    }
    saveMutation
      .mutateAsync(
        CreateAppResourceAPI(
          props.appId,
          { code: editForm.code, name: editForm.name, status: editForm.status },
          silentQueryRequest(),
        ),
      )
      .then(() => {
        message.success("操作成功");
        visible.value = false;
        emit("success");
      });
  });
};

defineExpose({
  show(data?: PlatformResource): void {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    copyParams(rawForm, defaultEditForm);
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });
    if (data) {
      copyParams(editForm, data);
      copyParams(rawForm, data);
      title.value = "编辑资源";
      edit.value = true;
      return;
    }
    title.value = "添加资源";
    edit.value = false;
  },
});
</script>
