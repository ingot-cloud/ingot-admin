<template>
  <div v-loading="loading">
    <in-form-group-title v-model="editFlag">
      <template #title>
        <div class="logo-title">
          <img v-if="orgInfo.avatar" :src="orgInfo.avatar" class="avatar" />
          <div class="title">{{ orgInfo.name }}</div>
        </div>
      </template>
    </in-form-group-title>

    <div p-20px>
      <in-form :ref="FormRef" :model="editForm" :rules="rules" :disabled="!editFlag">
        <el-form-item label="部门" prop="deptIds">
          <el-tree-select
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
            w-full
            v-model="editForm.roleIds"
            placeholder="请选择角色"
            :options="roleOrgOptions"
            multiple
            clearable
          />
        </el-form-item>
        <el-form-item v-if="editFlag">
          <div flex flex-row justify-end w-full gap-2>
            <in-button type="primary" @click="handleSaveClick">保存</in-button>
            <in-button type="danger" @click="handleDeleteClick">删除</in-button>
          </div>
        </el-form-item>
      </in-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import type { UserOrgInfoVO, UserOrgEditDTO, SysTenant, DeptTreeNode, Option } from "@/models";
import { UserOrgEditAPI, UserOrgLeaveAPI } from "@/api/basic/user";
import { TreeKeyAndProps } from "@/models";
import { copyParams, getDiffWithIgnore } from "@/utils/object";
import { useRoleStore } from "@/stores/modules/role";
import { useDeptStore } from "@/stores/modules/dept";
import { useTenantStore } from "@/stores/modules/tenant";

const emits = defineEmits(["success"]);
const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  org: {
    type: Object as PropType<UserOrgInfoVO>,
    required: true,
  },
});

const defaultEditForm: UserOrgEditDTO = {
  id: undefined,
  orgId: undefined,
  deptIds: undefined,
  roleIds: undefined,
};

const rules = {};

const FormRef = ref();
const editFlag = ref(false);
const loading = ref(false);

const orgInfo = reactive<SysTenant>({});
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm = reactive(Object.assign({}, defaultEditForm));

const message = useMessage();
const confirm = useMessageConfirm();
const roleStore = useRoleStore();
const deptStore = useDeptStore();
const tenantStore = useTenantStore();
const deptTree = ref<Array<DeptTreeNode>>([]);
const roleOrgOptions = ref<Array<Option<string>>>([]);

const handleSaveClick = () => {
  const result = getDiffWithIgnore(rawForm, editForm);
  if (Object.keys(result).length === 0) {
    message.warning("未修改任何数据");
    return;
  }

  loading.value = true;
  editForm.id = props.userId;
  UserOrgEditAPI(editForm)
    .then(() => {
      loading.value = false;
      editFlag.value = false;
      message.success("保存成功");
      emits("success");
    })
    .catch(() => {
      loading.value = false;
    });
};

const handleDeleteClick = () => {
  confirm.warning("是否离开该组织").then(() => {
    loading.value = true;
    UserOrgLeaveAPI({
      id: props.userId,
      orgId: props.org!.orgId,
    })
      .then(() => {
        loading.value = false;
        editFlag.value = false;
        message.success("操作成功");
        emits("success");
      })
      .catch(() => {
        loading.value = false;
      });
  });
};

const fetchData = (orgId: string) => {
  loading.value = true;
  Promise.all([
    tenantStore.info(orgId),
    roleStore.fetchRoleOrgOptions(orgId),
    deptStore.fetchOrgDeptTree(orgId),
  ])
    .then((result) => {
      loading.value = false;
      copyParams(orgInfo, result[0]);
      roleOrgOptions.value = result[1];
      deptTree.value = result[2];
      copyParams(editForm, props.org!);
      copyParams(rawForm, props.org!);
    })
    .catch(() => {
      loading.value = false;
    });
};

defineExpose({
  refresh() {
    fetchData(props.org!.orgId!);
  },
});
</script>
<style scoped lang="postcss">
.logo-title {
  display: flex;
  flex-direction: row;
  gap: 5px;
  grid-gap: 5px;
  & .title {
    font-size: 12px;
    color: black;
    font-weight: 500;
  }
  & .avatar {
    height: 20px;
    width: 20px;
  }
}
</style>
