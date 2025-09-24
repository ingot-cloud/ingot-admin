<template>
  <in-filter-container>
    <template #header>
      <ContactsTabs select-tab="权限" />
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
      :data="ops.records.value"
      :headers="tableHeaders"
      ref="tableRef"
      @refresh="ops.fetchData"
    >
      <template #title>
        {{ ops.currentNode.name || "请选择角色" }}
      </template>
      <template #toolbar>
        <in-button
          v-if="ops.currentNode.name && !isRoleManager(ops.currentNode.code!)"
          type="primary"
          @click="privateAddAuth"
        >
          编辑权限
        </in-button>
      </template>
      <template #code="{ item }">
        <div flex flex-row gap-2>
          <div>{{ item.name }}</div>
          <in-copy-tag :text="item.code" />
        </div>
      </template>
    </in-table>
  </in-filter-container>

  <AddAuthDrawer ref="AddAuthDrawerRef" @success="ops.fetchData" />
</template>
<script lang="ts" setup>
import ContactsTabs from "@/pages/org/contacts/components/ContactsTabs.vue";
import LeftContent from "./components/LeftContent.vue";
import { useOps } from "./useOps";
import { tableHeaders } from "./table";
import AddAuthDrawer from "./components/AddAuthDrawer.vue";
import { isRoleManager } from "@/constants/role";

const AddAuthDrawerRef = ref();
const ops = useOps();

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

const privateAddAuth = () => {
  AddAuthDrawerRef.value.show(ops.currentNode.id, ops.currentNode.name, stretch(ops.records.value));
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
