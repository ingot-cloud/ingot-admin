<template>
  <in-dialog title="加入组织" v-model="visible" width="500">
    <in-form ref="JoinFormRef" :model="editForm" :rules="rules">
      <el-form-item label="组织" prop="orgId">
        <tenant-options w-full v-model="editForm.orgId" @onChanged="handleTenantChange" />
      </el-form-item>
      <el-form-item label="部门" prop="deptIds">
        <el-tree-select
          w-full
          multiple
          v-model="editForm.deptIds"
          placeholder="请选择部门"
          :data="deptTree"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>
      <el-form-item label="角色" prop="roleIds">
        <el-tree-select
          w-full
          multiple
          v-model="editForm.roleIds"
          placeholder="请选择角色"
          :data="roleOrgTree"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="treeSelectProps"
          :check-strictly="true"
        >
          <template #default="{ data: { name, filterDept } }">
            {{ name }}
            <el-tag style="height: 18px; line-height: 18px" v-if="filterDept" type="info">
              部门角色
            </el-tag>
          </template>
        </el-tree-select>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-dialog>
</template>
<script lang="ts">
export interface API {
  show(): void;
}
</script>
<script lang="ts" setup>
import type { UserOrgEditDTO, RoleTreeNodeVO } from "@/models";
import { RoleTypeEnums } from "@/models/enums";
import { copyParams } from "@ingot/admin-core";
import { TreeKeyAndProps } from "@/models";
import { UserOrgEditAPI } from "@/api/platform/admin/user";
import { fetchPlatformAdminDeptTree } from "@/api/platform/admin/dept.query";
import { fetchPlatformAdminRoleTree } from "@/api/platform/admin/role.query";
import type { DeptTreeNodeWithManagerVO } from "@/models";

const emits = defineEmits(["success"]);

const defaultEditForm: UserOrgEditDTO = {
  id: undefined,
  orgId: undefined,
  deptIds: undefined,
  roleIds: undefined,
};

const rules = {
  orgId: [{ required: true, message: "请输入加入的组织", trigger: "blur" }],
};

const JoinFormRef = ref();
const loading = ref(false);
const visible = ref(false);

const userId = ref("");
const editForm = reactive(Object.assign({}, defaultEditForm));

const message = useMessage();
const deptTree = ref<Array<DeptTreeNodeWithManagerVO>>([]);
const roleOrgTree = ref<Array<RoleTreeNodeVO>>([]);

const treeSelectProps = {
  ...TreeKeyAndProps.props,
  disabled: (data: RoleTreeNodeVO) => {
    return data.filterDept || data.type === RoleTypeEnums.GROUP;
  },
};
const handleTenantChange = (orgId: string) => {
  if (!orgId) {
    deptTree.value = [];
    roleOrgTree.value = [];
    return;
  }
  Promise.all([fetchPlatformAdminDeptTree(orgId), fetchPlatformAdminRoleTree(orgId)]).then(
    ([depts, roles]) => {
      deptTree.value = depts;
      roleOrgTree.value = roles;
    },
  );
};

const handleConfirmClick = () => {
  const form = unref(JoinFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      editForm.id = userId.value;
      UserOrgEditAPI(editForm)
        .then(() => {
          loading.value = false;
          visible.value = false;
          message.success("操作成功");
          emits("success");
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};
defineExpose({
  show(id: string) {
    userId.value = id;
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    nextTick(() => {
      const form = unref(JoinFormRef);
      form.clearValidate();
    });
  },
});
</script>
