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
      <el-form-item label="上级角色" prop="pid">
        <el-tree-select
          w-full
          v-model="editForm.pid"
          :data="roleList"
          :disabled="isAddChild || isEdit"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>
      <el-form-item label="角色类型" prop="type" v-if="!isEdit">
        <in-select
          w-full
          v-model="editForm.type"
          placeholder="请选择类型"
          :options="roleTypeEnum.getOptions()"
          clearable
        />
      </el-form-item>

      <el-form-item label="组织类型" prop="orgType" v-if="!isEdit && !isAddChild">
        <in-select
          w-full
          v-model="editForm.orgType"
          placeholder="请选择类型"
          :options="orgTypeEnum.getOptions()"
          clearable
        />
      </el-form-item>

      <el-form-item label="角色名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入角色名称"></el-input>
      </el-form-item>

      <el-form-item label="角色编码" prop="code" v-if="editForm.type === RoleTypeEnums.ROLE">
        <el-input
          :disabled="isEdit"
          v-model="editForm.code"
          clearable
          placeholder="请输入角色编码"
        ></el-input>
      </el-form-item>

      <el-form-item prop="filterDept" label="部门角色">
        <el-radio-group v-model="editForm.filterDept">
          <el-radio-button :value="true"> 是 </el-radio-button>
          <el-radio-button :value="false"> 否 </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="isEdit" label="权限">
        <div flex flex-col gap-2>
          <div flex flex-wrap gap-2 flex-row v-if="bindAuthorities.length > 0">
            <in-tag
              v-for="authority in bindAuthorities"
              :key="authority.id"
              :value="{ text: authority.name!, tag: 'info' }"
            />
          </div>
          <in-tag v-else :value="{ text: '暂无权限', tag: 'info' }"></in-tag>
          <div
            v-if="editForm.orgType == OrgTypeEnums.Tenant"
            class="text-sm text-gray-500 color-red"
          >
            *组织类型的角色，这里配置的权限为预设权限，对所有组织生效
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button
        v-if="isEdit && editForm.type == OrgTypeEnums.System"
        type="success"
        @click="handleBindCommand"
      >
        编辑权限
      </in-button>
      <common-status-button
        v-if="isEdit"
        :status="editForm.status"
        @click="handleStatusClick"
      >
      </common-status-button>
      <in-button v-if="isEdit" type="danger" @click="handleRemoveClick"> 删除 </in-button>
      <in-button type="primary" @click="handleActionButton">确定</in-button>
    </template>
  </in-drawer>
  <BindAuthDialog ref="bindAuthDialogRef" @success="privateOnBindSuccess" />
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import {
  TreeKeyAndProps,
  type RoleTreeNodeVO,
  type PlatformRole,
} from "@/models";
import { Confirm, Message, getCommonStatusActionDesc, getCommonStatusToggle } from "@ingot/admin-core";
import { copyParamsWithKeys, getDiffWithIgnore } from "@ingot/admin-core";
import { useOrgTypeEnums, OrgTypeEnums, RoleTypeEnums, useRoleTypeEnums, type CommonStatus } from "@/models/enums";
import {
  CreateRoleAPI,
  UpdateRoleAPI,
  DeleteRoleAPI,
} from "@/api/platform/config/role.ts";
import {
  PlatformRoleBindAuthoritiesQueryOptions,
  platformRoleQueryKeys,
} from "@/api/platform/config/role.query";
import BindAuthDialog from "./BindAuthDialog.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
const rawForm: PlatformRole = {
  id: undefined,
  pid: undefined,
  name: undefined,
  code: undefined,
  type: undefined,
  orgType: undefined,
  filterDept: false,
  scopeType: undefined,
  scopes: [],
  status: undefined,
};

const keys = [
  "id",
  "pid",
  "name",
  "code",
  "status",
  "type",
  "orgType",
  "filterDept",
  "scopeType",
  "scopes",
];

const roleTypeEnum = useRoleTypeEnums();
const orgTypeEnum = useOrgTypeEnums();

const editFormRef = ref();
const bindAuthDialogRef = ref();
const title = ref("");
const show = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const isAddChild = ref(false);

const id = ref("");
const editForm = reactive(Object.assign({}, rawForm));
const rawEditForm = Object.assign({}, rawForm);
const queryClient = useQueryClient();
const bindQuery = useQuery(() => ({
  ...PlatformRoleBindAuthoritiesQueryOptions(() => id.value),
  enabled: show.value && isEdit.value && Boolean(id.value),
}));
const bindAuthorities = computed(() => bindQuery.data.value ?? []);
const rules = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
  type: [{ required: true, message: "请选择角色类型", trigger: "blur" }],
  orgType: [{ required: true, message: "请选择组织类型", trigger: "blur" }],
};

const emits = defineEmits(["success"]);
defineProps({
  roleList: {
    type: Array as PropType<Array<RoleTreeNodeVO>>,
    required: true,
  },
});

const handleRemoveClick = () => {
  Confirm.warning(`是否删除角色(${editForm.name})`).then(() => {
    DeleteRoleAPI(editForm.id!).then(() => {
      Message.success("删除成功");
      show.value = false;
      emits("success");
    });
  });
};

const handleStatusClick = () => {
  const next = getCommonStatusToggle(editForm.status as CommonStatus);
  Confirm.warning(`是否${getCommonStatusActionDesc(next)}角色(${editForm.name})`).then(() => {
    UpdateRoleAPI({ id: editForm.id, status: next }).then(() => {
      Message.success("操作成功");
      show.value = false;
      emits("success");
    });
  });
};

const stretch = (tree: Array<any>): Array<string> => {
  let ids: Array<string> = [];

  tree.forEach((item) => {
    ids.push(item.id as string);
    if (item.children) {
      ids = ids.concat(stretch(item.children));
    }
  });

  return ids;
};

const handleBindCommand = (): void => {
  const roleId = editForm.id;
  bindAuthDialogRef.value.show(
    roleId,
    editForm.name,
    editForm.orgType!,
    stretch(bindAuthorities.value),
  );
};

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
        params.id = id.value;
        request = UpdateRoleAPI(params);
      } else {
        request = CreateRoleAPI(params);
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

const privateOnBindSuccess = (): void => {
  void queryClient.invalidateQueries({ queryKey: platformRoleQueryKeys.permissions(id.value) });
};

defineExpose({
  show(data?: RoleTreeNodeVO, isAddChildValue: boolean = false) {
    show.value = true;
    isAddChild.value = isAddChildValue;
    copyParamsWithKeys(editForm, rawForm, keys);
    copyParamsWithKeys(rawEditForm, rawForm, keys);
    nextTick(() => {
      const form = unref(editFormRef);
      form.resetFields();

      if (data) {
        if (isAddChildValue) {
          title.value = "新增角色";
          isEdit.value = false;
          id.value = "";
          editForm.pid = data?.id! as string;
          editForm.type = RoleTypeEnums.ROLE;
          editForm.orgType = data?.orgType! as OrgTypeEnums;
        } else {
          title.value = "编辑角色";
          isEdit.value = true;
          id.value = data?.id!;
          copyParamsWithKeys(editForm, data!, keys);
          copyParamsWithKeys(rawEditForm, data!, keys);
        }
      } else {
        title.value = "新增角色";
        isEdit.value = false;
        id.value = "";
        editForm.type = RoleTypeEnums.ROLE;
        editForm.orgType = OrgTypeEnums.System;
      }
    });
  },
});
</script>
