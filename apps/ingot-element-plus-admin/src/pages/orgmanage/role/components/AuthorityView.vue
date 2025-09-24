<template>
  <in-table ref="bindTable" :headers="tableHeaders" :data="bindAuthorities" @refresh="refresh">
    <template #title> {{ currentNode.name || "请选择角色" }} </template>
    <template #subtitle>预设角色默认权限，创建新组织时生效</template>
    <template #toolbar>
      <in-button type="primary" @click="handleBindCommand()"> 编辑权限 </in-button>
    </template>
    <template #code="{ item }">
      <div flex flex-row gap-2>
        <el-tag>{{ item.name }}</el-tag>
        <in-copy-tag :text="item.code" />
      </div>
    </template>
  </in-table>
  <BindViewDrawer ref="BindViewDrawerRef" @success="refresh" />
</template>
<script lang="ts" setup>
import { GetBindAuthoritiesAPI } from "@/api/basic/role";
import { tableHeaders } from "../table";
import BindViewDrawer from "./BindViewDrawer.vue";
import type { RoleGroupItemVO, AuthorityTreeNode } from "@/models";
import { OrgTypeEnums } from "@/models/enums";

const BindViewDrawerRef = ref();
const currentNode = ref<RoleGroupItemVO>({});
const bindAuthorities = ref<Array<AuthorityTreeNode>>([]);
const handleBindCommand = (): void => {
  const roleId = currentNode.value.id!;
  BindViewDrawerRef.value.show(roleId, currentNode.value.name!, stretch(bindAuthorities.value));
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

const fetchData = (id: string) => {
  GetBindAuthoritiesAPI(id, true, {
    orgTypeText: OrgTypeEnums.Tenant,
  }).then((res) => {
    bindAuthorities.value = res.data;
  });
};

const refresh = () => {
  if (currentNode.value.id) {
    fetchData(currentNode.value.id!);
  }
};

defineExpose({
  setCurrentNode(node: RoleGroupItemVO) {
    currentNode.value = node;
    fetchData(currentNode.value.id!);
  },
});
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
</style>
