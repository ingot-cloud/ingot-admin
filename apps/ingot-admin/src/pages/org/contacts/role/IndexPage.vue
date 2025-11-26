<template>
  <in-filter-container>
    <template #header>
      <ContactsTabs select-tab="角色" />
    </template>

    <template #left>
      <div w-260px>
        <LeftContent @onNodeClick="ops.handleTreeNodeClick" />
      </div>
    </template>

    <div class="default-role-bg-container" v-if="!ops.currentNode.name">
      <img class="default-role-bg" src="/resource/images/role_default_bg.jpg" alt="" />
    </div>

    <in-table
      v-else
      hide-setting
      :loading="ops.loading.value"
      :data="ops.pageInfo.records"
      :headers="tableHeaders"
      :page="ops.pageInfo"
      ref="tableRef"
      @refresh="ops.fetchUserData"
      @handleSizeChange="ops.fetchUserData"
      @handleCurrentChange="ops.fetchUserData"
    >
      <template #title>
        {{ ops.currentNode.name || "请选择角色" }}
      </template>
      <template #toolbar>
        <in-button v-if="ops.currentNode.name" type="primary" @click="privateAddMember">
          添加成员
        </in-button>
      </template>
      <template #avatar="{ item }">
        <div flex flex-row items-center gap-2 justify-start>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          {{ item.nickname }}
        </div>
      </template>
      <template #actions="{ item }">
        <in-button-delete @click="privateHandleDelete(item)" />
      </template>
    </in-table>
  </in-filter-container>

  <AddMemberDialog ref="AddMemberDialogRef" @success="ops.fetchUserData" />
</template>
<script lang="ts" setup>
import ContactsTabs from "@/pages/org/contacts/components/ContactsTabs.vue";
import LeftContent from "./components/LeftContent.vue";
import { useOps } from "./useOps";
import { tableHeaders } from "./table";
import AddMemberDialog from "./components/AddMemberDialog.vue";
import { BindUserAPI } from "@/api/org/role";

const AddMemberDialogRef = ref();
const ops = useOps();
const confirm = useMessageConfirm();
const privateAddMember = () => {
  AddMemberDialogRef.value.show(ops.currentNode);
};
const privateHandleDelete = (item: any) => {
  confirm.warning(`是否将成员(${item.nickname})移除角色(${ops.currentNode.name})`).then(() => {
    BindUserAPI({
      id: ops.currentNode.id,
      unassignIds: [item.userId],
    }).then(() => {
      ops.fetchUserData();
    });
  });
};
</script>
<style scoped lang="postcss">
:deep(.in-filter-container-header) {
  padding: 0 !important;
}
.title {
  flex: 1;
  color: #171a1d;
  font-weight: 600;
  font-size: 17px;
}
.default-role-bg-container {
  display: flex;
  align-items: center;
  justify-content: center;
  & .default-role-bg {
    width: 80%;
    height: auto;
  }
}
</style>
