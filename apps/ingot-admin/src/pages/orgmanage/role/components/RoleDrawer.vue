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
      <el-form-item prop="filterDept" label="部门角色">
        <el-radio-group v-model="editForm.filterDept">
          <el-radio-button :value="true"> 是 </el-radio-button>
          <el-radio-button :value="false"> 否 </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="数据权限" prop="scopeType">
        <in-select
          w-full
          v-model="editForm.scopeType"
          placeholder="请选择数据权限"
          :options="useDataScope.getOptions()"
        />
      </el-form-item>
      <el-form-item
        label="数据范围"
        prop="scopes"
        v-if="editForm.scopeType === DataScopeTypeEnum.CUSTOM"
      >
        <BizDeptSelect w-full multiple v-model="editForm.scopes" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
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
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import type { RoleGroupItemVO, Option } from "@/models";
import { useRoleStore } from "@/stores/modules/role";
import { Message } from "@/utils/message";
import { copyParamsWithKeys, getDiffWithIgnore } from "@/utils/object";
import { useDataScopeTypeEnum, DataScopeTypeEnum } from "@/models/enums";
import { OrgTypeEnums } from "@/models/enums";

const rawForm = {
  id: undefined,
  name: undefined,
  groupId: undefined,
  code: undefined,
  filterDept: false,
  status: undefined,
  scopeType: undefined,
  scopes: [],
};

const keys = ["id", "name", "groupId", "code", "filterDept", "status", "scopeType", "scopes"];

const title = ref("");
const show = ref(false);
const id = ref();

const rules = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  groupId: [{ required: true, message: "请选择角色组", trigger: "blur" }],
  code: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
  scopeType: [{ required: true, message: "请选择数据权限", trigger: "blur" }],
  scopes: [{ required: true, message: "请选择数据范围", trigger: "blur" }],
};

const emits = defineEmits(["success"]);
defineProps({
  groupList: {
    type: Array as PropType<Array<Option>>,
    required: true,
  },
});

const roleStore = useRoleStore();
const useDataScope = useDataScopeTypeEnum();

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
        request = roleStore.createRole({
          ...params,
          type: OrgTypeEnums.Tenant,
        });
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
      } else {
        title.value = "新增角色";
        copyParamsWithKeys(editForm, rawForm, keys);
        copyParamsWithKeys(rawEditForm, rawForm, keys);
      }
    });
  },
});
</script>
