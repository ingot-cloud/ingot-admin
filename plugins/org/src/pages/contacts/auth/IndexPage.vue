<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="为角色绑定可访问权限。" />
    </template>

    <in-split-layout left-collapsible :persistence-key="ORG_AUTH_SPLIT_KEY">
      <template #left>
        <LeftContent @node-click="ops.handleTreeNodeClick" />
      </template>

      <div class="default-role-bg-container" v-if="!ops.currentNode.name">
        <img class="default-role-bg" :src="'/resource/images/role_default_bg.jpg'" alt="" />
      </div>

      <in-table
        v-else
        :loading="ops.loading.value"
        :data="ops.records.value"
        :headers="visibleHeaders"
        :table-id="ORG_AUTH_TABLE_ID"
        density="compact"
      >
        <template #title>
          {{ ops.currentNode.name }}
        </template>
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ORG_AUTH_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #code="{ item }">
          <div flex flex-row gap-2>
            <div>{{ item.name }}</div>
            <in-copy-tag :text="item.code" />
          </div>
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <AddAuthDrawer ref="AddAuthDrawerRef" @success="ops.fetchData" />
</template>

<script lang="ts" setup>
import { applyColumnSelection, isRoleManager } from "@ingot/admin-core";
import LeftContent from "./components/LeftContent.vue";
import { useOps } from "./useOps";
import {
  createOrgAuthToolbarActions,
  ORG_AUTH_SPLIT_KEY,
  ORG_AUTH_TABLE_ID,
  tableHeaders,
} from "./table";
import AddAuthDrawer from "./components/AddAuthDrawer.vue";
import { type BizPermissionTreeNodeVO } from "@/models";

const AddAuthDrawerRef = ref();
const ops = useOps();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow = {} satisfies BizPermissionTreeNodeVO;

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const stretch = (tree: Array<BizPermissionTreeNodeVO>, readonly?: boolean): Array<string> => {
  let ids: Array<string> = [];

  tree.forEach((item) => {
    if (readonly) {
      if (item.defaultFlag) {
        ids.push(item.id as string);
      }
    } else {
      ids.push(item.id as string);
    }
    if (item.children) {
      ids = ids.concat(stretch(item.children, readonly));
    }
  });

  return ids;
};

const privateAddAuth = () => {
  AddAuthDrawerRef.value.show(
    ops.currentNode.id,
    ops.currentNode.name,
    stretch(ops.records.value),
    stretch(ops.records.value, true),
  );
};

const toolbarActions = computed(() =>
  createOrgAuthToolbarActions(
    Boolean(ops.currentNode.name && !isRoleManager(ops.currentNode.code!)),
    privateAddAuth,
  ),
);

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>

<style scoped lang="postcss">
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
