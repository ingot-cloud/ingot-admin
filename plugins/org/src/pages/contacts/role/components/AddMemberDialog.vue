<template>
  <in-dialog :title="title" v-model="visible" width="800">
    <in-table
      hide-setting
      :loading="paging.fetching.value"
      :data="paging.pageInfo.value.records"
      :headers="tableHeaders"
      :page="paging.pageInfo.value"
      ref="AddMemberTableRef"
      row-key="userId"
      @refresh="paging.fetchData"
      @handleSizeChange="paging.fetchData"
      @handleCurrentChange="paging.fetchData"
      @selectionChange="onSelectChanged"
    >
      <template #toolbar>
        <div m-t-10px gap-2 flex flex-col>
          <div v-if="currentDeptNode.id">
            当前选择部门：
            <el-tag closable @close="onDeptNodeClose">
              {{ currentDeptNode.name }}
            </el-tag>
          </div>
          <div gap-2 flex flex-row items-center>
            <el-input
              v-model="paging.condition.nickname"
              clearable
              w-200px
              placeholder="请输入名称"
            ></el-input>
            <in-button @click="paging.search()" type="primary">搜索</in-button>
          </div>
        </div>
      </template>
      <template #avatar="{ item }">
        <div flex flex-row items-center gap-2>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          {{ item.nickname }}
        </div>
      </template>
    </in-table>
    <template #footer>
      <in-button type="primary" @click="onConfirmClick" :loading="confirmLoading"> 确定 </in-button>
    </template>
  </in-dialog>
  <SelectDeptDialog ref="SelectDeptDialogRef" @onNodeClick="onDeptNodeClick" />
</template>
<script lang="ts" setup>
import type { TableHeaderRecord } from "@ingot/admin-core";
import type {
  RoleTreeNodeVO,
  DeptTreeNode,
  UserPageItemWithBindRoleStatusVO,
  UserQueryDTO,
} from "@/models";
import { BindUserAPI } from "@/api/org/role";
import { OrgUserRoleBindPageQueryOptions, orgUserQueryKeys } from "@/api/org/user.query";
import { useServerPaging } from "@ingot/admin-core";
import { useQueryClient } from "@tanstack/vue-query";
import SelectDeptDialog from "./SelectDeptDialog.vue";

const emits = defineEmits(["success"]);
const queryClient = useQueryClient();

const tableHeaders: Array<TableHeaderRecord> = [
  {
    type: "selection",
    width: "50",
    selectable: (row: { canBind?: boolean }) => Boolean(row.canBind),
  },
  {
    label: "名称",
    prop: "avatar",
  },
  {
    label: "手机号",
    prop: "phone",
  },
];
const AddMemberTableRef = ref();
const SelectDeptDialogRef = useTemplateRef("SelectDeptDialogRef");
const paging = useServerPaging<UserPageItemWithBindRoleStatusVO, UserQueryDTO>({
  queryOptions: OrgUserRoleBindPageQueryOptions,
  queryWhen: (submitted) => Boolean(submitted.roleId),
});
const visible = ref(false);
const title = ref("");
const id = ref("");
const currentNode = ref<RoleTreeNodeVO>({});
const currentDeptNode = ref<DeptTreeNode>({});
const bindIds = ref<Array<string>>([]);
const confirmLoading = ref(false);
const message = useMessage();

const onSelectChanged = (value: Array<UserPageItemWithBindRoleStatusVO>) => {
  bindIds.value = value.map((item) => item.userId);
};

const onDeptNodeClick = (value: DeptTreeNode) => {
  currentDeptNode.value = value;
};

const onDeptNodeClose = () => {
  currentDeptNode.value = {};
};

const onConfirmClick = () => {
  if (bindIds.value.length === 0) {
    message.warning("请选择绑定用户");
    return;
  }

  if (currentNode.value.filterDept && !currentDeptNode.value.id) {
    SelectDeptDialogRef.value?.show();
    return;
  }

  confirmLoading.value = true;
  BindUserAPI({
    id: id.value,
    assignIds: bindIds.value,
    deptId: currentDeptNode.value.id,
  })
    .then(() => {
      message.success("操作成功");
      confirmLoading.value = false;
      visible.value = false;
      void queryClient.invalidateQueries({ queryKey: orgUserQueryKeys.lists() });
      emits("success");
    })
    .catch(() => {
      confirmLoading.value = false;
    });
};

defineExpose({
  show: (params: RoleTreeNodeVO) => {
    currentNode.value = params;
    paging.condition.roleId = params.id;
    paging.search();
    id.value = params.id!;
    title.value = params.name!;
    visible.value = true;
    nextTick(() => {
      AddMemberTableRef.value?.clearSelection();
    });
  },
});
</script>
