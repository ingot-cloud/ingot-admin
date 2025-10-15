<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="角色名称">
          <el-input
            v-model="filter.roleName"
            clearable
            style="width: 200px"
            placeholder="请输入角色名称"
          ></el-input>
        </in-with-label>
        <template #rightActions>
          <in-button @click="filter.roleName = undefined"> 重置 </in-button>
          <in-button type="primary" @in-click="refreshData" :loading="loading"> 搜索 </in-button>
        </template>
      </in-filter-item>
    </template>
    <in-table
      :loading="loading"
      :data="roleTree"
      ref="tableRef"
      :headers="tableHeaders"
      :expandRowKeys="groupList.map((item) => item.value)"
      @refresh="refreshData"
    >
      <template #title> 角色管理 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleCreate(false)"> 添加角色 </in-button>
        <in-button type="primary" @click="handleCreate(true)"> 添加角色组 </in-button>
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
        <common-status-tag :status="item.status"></common-status-tag>
      </template>
      <template #type="{ item }">
        <in-tag-enum :value="item.type" :enumObj="roleType" />
      </template>
      <template #actions="{ item }">
        <in-button text link type="primary" @click="handleEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
      </template>
    </in-table>

    <RoleDrawer ref="RoleDrawerRef" :groupList="groupList" @success="refreshData" />
    <RoleGroupDrawer ref="RoleGroupDrawerRef" @success="refreshData" />
  </in-filter-container>
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { RoleGroupItemVO, Option, RoleFilterDTO } from "@/models";
import type { TableAPI } from "@/components/table";
import { useRoleStore } from "@/stores/modules/role";
import { useOrgTypeEnums, OrgTypeEnums } from "@/models/enums";
import RoleDrawer from "./components/RoleDrawer.vue";
import RoleGroupDrawer from "./components/RoleGroupDrawer.vue";

const RoleDrawerRef = ref();
const RoleGroupDrawerRef = ref();
const tableRef = ref<TableAPI>();

// 系统角色
const filter = ref<RoleFilterDTO>({ roleType: OrgTypeEnums.System });
const roleTree = ref<Array<RoleGroupItemVO>>([]);
const groupList = ref<Array<Option>>([]);

const loading = ref(false);
const roleType = useOrgTypeEnums();
const roleStore = useRoleStore();

const refreshData = () => {
  loading.value = true;
  roleStore
    .fetchRoleGroupList(filter.value)
    .then((data) => {
      loading.value = false;
      roleTree.value = data;
      groupList.value = roleTree.value.map((item) => {
        return {
          value: item.id!,
          label: item.name!,
        };
      });
    })
    .catch(() => {
      loading.value = false;
    });
};

const handleCreate = (isGroup: boolean): void => {
  if (isGroup) {
    RoleGroupDrawerRef.value.show();
  } else {
    RoleDrawerRef.value.show();
  }
};

const handleEdit = (params: RoleGroupItemVO): void => {
  if (params.isGroup) {
    RoleGroupDrawerRef.value.show(params);
  } else {
    RoleDrawerRef.value.show(params);
  }
};

onMounted(() => {
  refreshData();
});
</script>
