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
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入角色名称"></el-input>
      </el-form-item>
      <el-form-item label="角色组" prop="groupId">
        <in-select
          w-full
          v-model="editForm.groupId"
          placeholder="请选择角色组"
          :options="groupList"
          :disabled="isEdit"
        />
      </el-form-item>
      <el-form-item label="角色编码" prop="code">
        <el-input
          :disabled="isEdit"
          v-model="editForm.code"
          clearable
          placeholder="请输入角色编码"
        ></el-input>
      </el-form-item>

      <el-form-item label="类型" prop="type">
        <in-select
          w-full
          disabled
          v-model="editForm.type"
          placeholder="请选择类型"
          :options="roleTypeEnum.getOptions()"
          clearable
        />
      </el-form-item>
      <el-form-item v-if="isEdit" label="权限">
        <div flex flex-wrap gap-2 flex-row>
          <in-tag
            v-for="authority in bindAuthorities"
            :key="authority.id"
            :value="{ text: authority.name!, tag: 'info' }"
          />
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
        @click="
          confirmStatus.exec(editForm.id!, editForm.status!, `角色(${editForm.name})`, '操作成功')
        "
      >
      </common-status-button>
      <in-button v-if="isEdit" type="danger" @click="handleRemoveClick"> 删除 </in-button>
      <in-button type="primary" @click="handleActionButton">确定</in-button>
    </template>
  </in-drawer>
  <BindAuthDialog ref="bindAuthDialogRef" @success="fetchBindAuthorities" />
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import type { RoleGroupItemVO, Option, AuthorityTreeNode } from "@/models";
import { useRoleStore } from "@/stores/modules/role";
import { Message } from "@/utils/message";
import { copyParamsWithKeys, getDiffWithIgnore } from "@/utils/object";
import { useOrgTypeEnums, OrgTypeEnums } from "@/models/enums";
import { GetBindAuthoritiesAPI } from "@/api/basic/role";
import BindAuthDialog from "./BindAuthDialog.vue";
const rawForm = {
  id: undefined,
  name: undefined,
  groupId: undefined,
  type: OrgTypeEnums.System,
  code: undefined,
  status: undefined,
};

const keys = ["id", "name", "groupId", "code", "status", "type"];

const title = ref("");
const show = ref(false);
const bindAuthDialogRef = ref();
const id = ref();
const bindAuthorities = ref<Array<AuthorityTreeNode>>([]);
const rules = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  groupId: [{ required: true, message: "请选择角色组", trigger: "blur" }],
  code: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
};

const emits = defineEmits(["success"]);
defineProps({
  groupList: {
    type: Array as PropType<Array<Option>>,
    required: true,
  },
});

const roleStore = useRoleStore();
const roleTypeEnum = useOrgTypeEnums();

const editFormRef = ref();
const editForm = reactive(Object.assign({}, rawForm));
const rawEditForm = Object.assign({}, rawForm);
const loading = ref(false);
const isEdit = ref(false);

const confirmStatus = useConfirmStatus(roleStore.updateRole, () => {
  show.value = false;
  emits("success");
});
const confirmDelete = useConfirmDelete(roleStore.removeRole, () => {
  show.value = false;
  emits("success");
});

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

const handleRemoveClick = () => {
  confirmDelete.exec(editForm.id!, `是否删除角色(${editForm.name})`, "删除成功");
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

const fetchBindAuthorities = () => {
  GetBindAuthoritiesAPI(id.value!, true).then((res) => {
    bindAuthorities.value = res.data;
  });
};

defineExpose({
  show(data?: RoleGroupItemVO) {
    isEdit.value = Boolean(data);
    show.value = true;
    nextTick(() => {
      const form = unref(editFormRef);
      form.resetFields();

      if (isEdit.value) {
        title.value = "编辑角色";
        id.value = data?.id!;
        copyParamsWithKeys(editForm, data!, keys);
        copyParamsWithKeys(rawEditForm, data!, keys);
        fetchBindAuthorities();
      } else {
        title.value = "新增角色";
        copyParamsWithKeys(editForm, rawForm, keys);
        copyParamsWithKeys(rawEditForm, rawForm, keys);
      }
    });
  },
});
</script>
