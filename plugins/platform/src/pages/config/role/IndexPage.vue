<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="维护平台角色树与授权。" />
    </template>

    <in-split-layout>
      <in-table
        :loading="roleQuery.isFetching.value"
        :data="roleTree"
        :headers="visibleHeaders"
        :table-id="ROLE_TABLE_ID"
        density="compact"
        :expandRowKeys="roleTree.map((item) => item.id!)"
      >
        <template #tools-start>
          <el-input
            v-model="filter.name"
            class="w-200px!"
            clearable
            placeholder="搜索角色名"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="ROLE_TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>
        <template #name="{ item }">
          <in-button text link @click="handleEdit(item)">
            {{ item.name }}
          </in-button>
        </template>
        <template #code="{ item }">
          <el-tag>
            {{ item.code || "-" }}
          </el-tag>
        </template>
        <template #status="{ item }">
          <in-common-status-tag :status="item.status" />
        </template>
        <template #type="{ item }">
          <in-tag-enum :value="item.type" :enumObj="roleTypeEnums" />
        </template>
        <template #orgType="{ item }">
          <in-tag-enum :value="item.orgType" :enumObj="orgTypeEnums" />
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <RoleDrawer ref="RoleDrawerRef" :roleList="roleTree" @success="refreshData" />
</template>

<script setup lang="ts">
import { applyColumnSelection, type InTableAction } from "@ingot/admin-core";
import type { RoleTreeNodeVO, PlatformRole } from "@/models";
import { Search } from "@element-plus/icons-vue";
import {
  PlatformRoleTreeQueryOptions,
  platformRoleQueryKeys,
} from "@/api/platform/config/role.query";
import { useOrgTypeEnums, useRoleTypeEnums } from "@/models/enums";
import RoleDrawer from "./components/RoleDrawer.vue";
import {
  createRoleRowActions,
  createRoleToolbarActions,
  ROLE_TABLE_ID,
  tableHeaders,
} from "./table";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const RoleDrawerRef = ref();
const queryClient = useQueryClient();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: RoleTreeNodeVO = {};

const filter = reactive<PlatformRole>({});
const submitted = ref<PlatformRole>({});
const roleQuery = useQuery(() => PlatformRoleTreeQueryOptions(() => submitted.value));
const roleTree = computed(() => roleQuery.data.value ?? []);

const orgTypeEnums = useOrgTypeEnums();
const roleTypeEnums = useRoleTypeEnums();

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

const refreshData = (): void => {
  submitted.value = { ...filter };
  void queryClient.invalidateQueries({ queryKey: platformRoleQueryKeys.lists() });
};

const handleCreate = (): void => {
  RoleDrawerRef.value.show();
};

const handleEdit = (params: RoleTreeNodeVO): void => {
  RoleDrawerRef.value.show(params);
};

const handleAddChild = (params: RoleTreeNodeVO): void => {
  RoleDrawerRef.value.show(params, true);
};

const toolbarActions = computed(() => createRoleToolbarActions(handleCreate));

const rowActionsOf = (item: RoleTreeNodeVO): Array<InTableAction<RoleTreeNodeVO>> =>
  createRoleRowActions(item, {
    onEdit: handleEdit,
    onAddChild: handleAddChild,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};

onMounted(() => {
  refreshData();
});
</script>
