<template>
  <in-dialog title="加入组织" v-model="visible" width="500">
    <in-form ref="JoinFormRef" :model="editForm" :rules="rules">
      <el-form-item label="组织" prop="orgId">
        <tenant-options w-full v-model="editForm.orgId" @onChanged="handleTenantChange" />
      </el-form-item>
      <el-form-item label="部门" prop="deptIds">
        <el-tree-select
          :disabled="!editForm.orgId"
          w-full
          multiple
          v-model="editForm.deptIds"
          :data="deptTree"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>
      <el-form-item label="角色" prop="roleIds">
        <in-select
          :disabled="!editForm.orgId"
          w-full
          v-model="editForm.roleIds"
          placeholder="请选择角色"
          :options="roleOrgOptions"
          multiple
          clearable
        />
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
import type { UserOrgEditDTO } from "@/models";
import { TreeKeyAndProps } from "@/models";
import { copyParams } from "@/utils/object";
import { UserOrgEditAPI } from "@/api/basic/user";
import { useRoleStore } from "@/stores/modules/role";
import { useDeptStore } from "@/stores/modules/dept";

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
const roleStore = useRoleStore();
const deptStore = useDeptStore();
const { deptTree } = storeToRefs(deptStore);
const { roleOrgOptions } = storeToRefs(roleStore);

const handleTenantChange = (orgId: string) => {
  if (!orgId) {
    return;
  }
  deptStore.fetchOrgDeptTree(orgId);
  roleStore.fetchRoleOrgOptions(orgId);
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
