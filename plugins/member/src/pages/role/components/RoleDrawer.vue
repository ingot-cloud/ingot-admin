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
      <el-form-item label="内置角色" prop="builtIn" v-if="!isEdit">
        <el-radio-group w-full v-model="editForm.builtIn">
          <el-radio-button :value="true"> 是 </el-radio-button>
          <el-radio-button :value="false"> 否 </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="角色名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入角色名称"></el-input>
      </el-form-item>

      <el-form-item label="角色编码" prop="code">
        <el-input
          :disabled="isEdit"
          v-model="editForm.code"
          clearable
          placeholder="请输入角色编码"
        ></el-input>
      </el-form-item>

      <el-form-item v-if="isEdit" label="权限">
        <div flex flex-wrap gap-2 flex-row v-if="bindAuthorities.length > 0">
          <in-tag
            v-for="authority in bindAuthorities"
            :key="authority.id"
            :value="{ text: authority.name!, tag: 'info' }"
          />
        </div>
        <in-tag v-else :value="{ text: '暂无权限', tag: 'info' }"></in-tag>
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button v-if="isEdit" type="success" @click="handleBindCommand"> 编辑权限 </in-button>
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
  type MemberRoleTreeNodeVO,
  type MemberRole,
} from "@/models";
import { Confirm, Message, getCommonStatusActionDesc, getCommonStatusToggle } from "@ingot/admin-core";
import { copyParamsWithKeys, getDiffWithIgnore } from "@ingot/admin-core";
import type { CommonStatus } from "@/models/enums";
import {
  CreateRoleAPI,
  UpdateRoleAPI,
  DeleteRoleAPI,
} from "@/api/member/role";
import {
  MemberRoleBindAuthoritiesQueryOptions,
  memberRoleQueryKeys,
} from "@/api/member/role.query";
import BindAuthDialog from "./BindAuthDialog.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
const rawForm: MemberRole = {
  id: undefined,
  pid: undefined,
  name: undefined,
  code: undefined,
  builtIn: false,
};

const keys = ["id", "pid", "name", "code", "status", "builtIn"];

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
  ...MemberRoleBindAuthoritiesQueryOptions(() => id.value),
  enabled: show.value && isEdit.value && Boolean(id.value),
}));
const bindAuthorities = computed(() => bindQuery.data.value ?? []);
const rules = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
  type: [{ required: true, message: "请选择角色类型", trigger: "blur" }],
  builtIn: [{ required: true, message: "请选择内置角色", trigger: "blur" }],
};

const emits = defineEmits(["success"]);
defineProps({
  roleList: {
    type: Array as PropType<Array<MemberRoleTreeNodeVO>>,
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
  bindAuthDialogRef.value.show(roleId, editForm.name, stretch(bindAuthorities.value));
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
  void queryClient.invalidateQueries({ queryKey: memberRoleQueryKeys.permissions(id.value) });
};

defineExpose({
  show(data?: MemberRoleTreeNodeVO, isAddChildValue: boolean = false) {
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
      }
    });
  },
});
</script>
