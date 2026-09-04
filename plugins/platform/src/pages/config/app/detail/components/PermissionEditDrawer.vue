<template>
  <in-drawer :title="title" v-model="visible" width="480px">
    <el-alert
      v-if="showWildcardTip"
      type="warning"
      :closable="false"
      show-icon
      class="wildcard-tip"
      title="通配权限为动态授权"
      description="绑定以 :** 结尾的分组权限后，该命名空间内未来新增的权限将自动生效，请谨慎授权并确保已记录审计。"
    />
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
      <el-form-item label="上级权限">
        <el-tree-select
          w-full
          v-model="editForm.pid"
          :data="selectData"
          :disabled="edit || isReadOnly"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>
      <el-form-item v-if="!edit && !isReadOnly" label="节点类型" prop="nodeType">
        <in-select
          w-full
          v-model="editForm.nodeType"
          :options="creatableNodeTypeOptions"
          @change="privateOnNodeTypeChange"
        />
      </el-form-item>
      <el-form-item label="权限名称" prop="name">
        <el-input
          v-model="editForm.name"
          :disabled="isReadOnly"
          clearable
          placeholder="请输入权限名称"
        />
      </el-form-item>
      <el-form-item label="权限编码" prop="code">
        <el-input
          v-model="editForm.code"
          :disabled="edit || isReadOnly"
          clearable
          :placeholder="codePlaceholder"
        />
        <div v-if="appCode && !edit" class="code-hint">
          可填写片段，如 user:**，将自动位于 {{ appCode }}: 命名空间下
        </div>
      </el-form-item>
      <el-form-item v-if="edit && !isReadOnly" label="备注">
        <el-input v-model="editForm.remark" clearable placeholder="请输入备注" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button v-if="edit && !isReadOnly" type="danger" @click="privateOnRemove">删除</in-button>
      <in-button v-if="!isReadOnly" :loading="loading" type="primary" @click="privateOnConfirm">
        确定
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { AppPermissionCreateDTO, AppPermissionTreeNodeVO } from "@/models";
import { TreeKeyAndProps } from "@/models";
import { PermissionNodeTypeEnum, usePermissionNodeTypeEnum } from "@/models/enums";
import {
  CreateAppPermissionAPI,
  RemoveAppPermissionAPI,
  UpdateAppPermissionAPI,
} from "@/api/platform/config/app";
import { appQueryKeys } from "@/api/platform/config/app.query";
import { copyParams, getDiffWithIgnore, invalidateQueriesByKeys, silentQueryRequest } from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { TreeData } from "element-plus";

const props = defineProps<{
  appId: string;
  appCode?: string;
  selectData: TreeData;
}>();

const emit = defineEmits<{
  success: [];
}>();

const nodeTypeEnum = usePermissionNodeTypeEnum();

const creatableNodeTypeOptions = computed(() =>
  nodeTypeEnum
    .getOptions()
    .filter(
      (item) =>
        item.value === PermissionNodeTypeEnum.Group || item.value === PermissionNodeTypeEnum.Action,
    ),
);

const defaultEditForm: AppPermissionCreateDTO & { id?: string; remark?: string } = {
  pid: undefined,
  name: undefined,
  code: undefined,
  nodeType: PermissionNodeTypeEnum.Group,
  remark: undefined,
};

const editFormRef = ref();
const editForm = reactive({ ...defaultEditForm });
const rawForm = reactive({ ...defaultEditForm });
const title = ref("");
const edit = ref(false);
const isReadOnly = ref(false);
const visible = ref(false);
const message = useMessage();
const confirm = useMessageConfirm();
const queryClient = useQueryClient();

const invalidatePermissions = (): Promise<void> =>
  invalidateQueriesByKeys(queryClient, [
    appQueryKeys.permissions(props.appId),
    appQueryKeys.detail(props.appId),
  ]);

const saveMutation = useMutation({
  mutationFn: (request: Promise<unknown>) => request,
  onSuccess: () => invalidatePermissions(),
});

const removeMutation = useMutation({
  mutationFn: (permissionId: string) =>
    RemoveAppPermissionAPI(props.appId, permissionId, silentQueryRequest()),
  onSuccess: () => invalidatePermissions(),
});

const loading = computed(() => saveMutation.isPending.value || removeMutation.isPending.value);

const showWildcardTip = computed(
  () =>
    !edit.value &&
    !isReadOnly.value &&
    editForm.nodeType === PermissionNodeTypeEnum.Group &&
    !!editForm.code,
);

const codePlaceholder = computed(() =>
  editForm.nodeType === PermissionNodeTypeEnum.Group ? "如 user:**" : "如 user:create",
);

const validateCode = (_rule: unknown, value: string, callback: (error?: Error) => void): void => {
  if (!value) {
    callback(new Error("请输入权限编码"));
    return;
  }
  if (editForm.nodeType === PermissionNodeTypeEnum.Group && !value.endsWith(":**")) {
    callback(new Error("分组权限编码必须以 :** 结尾"));
    return;
  }
  if (editForm.nodeType === PermissionNodeTypeEnum.Action && value.includes("*")) {
    callback(new Error("操作权限编码不能包含通配符"));
    return;
  }
  callback();
};

const rules = {
  name: [{ required: true, message: "请输入权限名称", trigger: "blur" }],
  nodeType: [{ required: true, message: "请选择节点类型", trigger: "change" }],
  code: [{ validator: validateCode, trigger: "blur" }],
};

const privateOnNodeTypeChange = (): void => {
  editForm.code = undefined;
};

const privateOnRemove = (): void => {
  confirm.warning(`是否删除权限(${editForm.name})`).then(() => {
    removeMutation.mutateAsync(editForm.id!).then(() => {
      message.success("删除成功");
      visible.value = false;
      emit("success");
    });
  });
};

const privateOnConfirm = (): void => {
  unref(editFormRef)?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    if (edit.value) {
      const diff = getDiffWithIgnore(rawForm, editForm, ["name", "remark"]);
      if (Object.keys(diff).length === 0) {
        message.warning("未改变数据");
        return;
      }
      saveMutation
        .mutateAsync(
          UpdateAppPermissionAPI(props.appId, rawForm.id!, diff, silentQueryRequest()),
        )
        .then(() => {
          message.success("操作成功");
          visible.value = false;
          emit("success");
        });
      return;
    }

    saveMutation
      .mutateAsync(CreateAppPermissionAPI(props.appId, { ...toRaw(editForm) }, silentQueryRequest()))
      .then(() => {
        message.success("操作成功");
        visible.value = false;
        emit("success");
      });
  });
};

defineExpose({
  show(data?: AppPermissionTreeNodeVO | string): void {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    copyParams(rawForm, defaultEditForm);
    isReadOnly.value = false;
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      if (typeof data === "string") {
        title.value = "添加子权限";
        edit.value = false;
        editForm.pid = data;
        return;
      }

      copyParams(editForm, data);
      copyParams(rawForm, data);
      title.value = "编辑权限";
      edit.value = true;
      isReadOnly.value = !!(data.readOnly || data.managed);
      if (data.nodeType === PermissionNodeTypeEnum.Navigation) {
        isReadOnly.value = true;
      }
      return;
    }

    title.value = "添加权限";
    edit.value = false;
  },
});
</script>

<style lang="postcss" scoped>
.wildcard-tip {
  @apply mb-12px;
}

.code-hint {
  @apply mt-4px text-12px text-[var(--in-text-color-secondary)];
}
</style>
