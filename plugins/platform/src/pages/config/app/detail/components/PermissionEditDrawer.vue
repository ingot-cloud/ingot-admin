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
          :disabled="edit"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>
      <el-form-item v-if="!edit" label="节点类型" prop="nodeType">
        <in-select
          w-full
          v-model="editForm.nodeType"
          :options="creatableNodeTypeOptions"
          @onChanged="privateOnNodeTypeChange"
        />
      </el-form-item>
      <el-form-item label="权限名称" prop="name">
        <el-input
          v-model="editForm.name"
          clearable
          placeholder="请输入权限名称"
        />
      </el-form-item>
      <el-form-item label="权限编码" prop="code">
        <el-input
          v-model="editForm.code"
          :disabled="edit"
          clearable
          :placeholder="codePlaceholder"
        />
        <div v-if="appCode && !edit" class="code-hint">
          可填写片段，如 user:**，将自动位于 {{ appCode }}: 命名空间下
        </div>
      </el-form-item>
      <el-form-item v-if="!edit" label="绑定资源" prop="resourceId">
        <in-select
          w-full
          v-model="editForm.resourceId"
          clearable
          placeholder="数据操作建议绑定资源"
          :options="resourceOptions"
        />
      </el-form-item>
      <el-form-item v-if="edit" label="绑定资源">
        <span>{{ resourceLabel }}</span>
      </el-form-item>
      <el-form-item v-if="edit" label="备注">
        <el-input v-model="editForm.remark" clearable placeholder="请输入备注" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button v-if="edit && !isRoot" type="danger" @click="privateOnRemove">删除</in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirm">
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
import { AppResourceListQueryOptions, appQueryKeys } from "@/api/platform/config/app.query";
import { copyParams, getDiffWithIgnore, invalidateQueriesByKeys, silentQueryRequest } from "@ingot/admin-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import type { TreeData } from "element-plus";
import { isAppRootPermission } from "./permissionTree";

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
  resourceId: undefined,
  remark: undefined,
};

const editFormRef = ref();
const editForm = reactive({ ...defaultEditForm });
const rawForm = reactive({ ...defaultEditForm });
const title = ref("");
const edit = ref(false);
const isRoot = ref(false);
const visible = ref(false);
const message = useMessage();
const confirm = useMessageConfirm();
const queryClient = useQueryClient();
const resourceQuery = useQuery(() => AppResourceListQueryOptions(() => props.appId));
const resourceOptions = computed(() =>
  (resourceQuery.data.value ?? []).map((item) => ({
    label: item.code ? `${item.name}（${item.code}）` : (item.name ?? item.id ?? ""),
    value: item.id ?? "",
  })),
);
const resourceLabel = computed(() => {
  if (!editForm.resourceId) {
    return "未绑定";
  }
  return resourceOptions.value.find((item) => item.value === editForm.resourceId)?.label ?? editForm.resourceId;
});

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
    isRoot.value = false;
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
      isRoot.value = isAppRootPermission(data);
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
