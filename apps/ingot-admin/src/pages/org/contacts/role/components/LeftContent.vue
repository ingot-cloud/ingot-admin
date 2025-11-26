<template>
  <div class="role-filter">
    <el-input v-model="searchValue" placeholder="搜索角色" :prefix-icon="Search" clearable />

    <div class="action-box">
      <in-button @click="privateHandleCreateGroup">新增角色组</in-button>
      <in-button @click="privateHandleCreateRole">新增角色</in-button>
      <div>
        <el-divider direction="vertical" />
        <el-dropdown trigger="click">
          <el-icon size="22" cursor-pointer>
            <i-material-symbols:more-vert />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="privateHandleRoleCollapseAction(true)">
                <el-icon><i-material-symbols:expand-rounded /></el-icon>全部展开
              </el-dropdown-item>
              <el-dropdown-item @click="privateHandleRoleCollapseAction(false)">
                <el-icon><i-mdi:arrow-vertical-collapse /></el-icon>全部折叠
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <in-tree
      v-loading="loading"
      ref="roleTreeRef"
      class="member-role-tree"
      :data="roleTree"
      :props="TreeKeyAndProps.props"
      :node-key="TreeKeyAndProps.nodeKey"
      :default-expanded-keys="defaultExpandedKeys"
      draggable
      :allow-drag="privateAllowDrag"
      :allow-drop="privateAllowDrop"
      :filter-node-method="privateFilterNode"
      @node-drop="privateOnDropSuccess"
      @node-click="privateOnNodeClick"
      @node-expand="privateOnNodeExpand"
      @node-collapse="privateOnNodeCollapse"
    >
      <template #default="{ node, data }">
        <div class="role-item">
          <in-icon
            v-if="data.type == RoleTypeEnums.GROUP"
            name="mingcute:group-line"
            class="icon"
          />
          <in-icon v-else name="tabler:user" class="icon" />
          <span class="text">{{ node.label }}</span>
          <el-dropdown trigger="hover" class="action" v-if="data.custom">
            <div class="action-icon">
              <in-icon name="icon-park-outline:more" cursor-pointer />
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="privateEditRoleOrGroup(data)"> 编辑 </el-dropdown-item>
                <el-dropdown-item @click="privateDeleteRoleOrGroup(data)"> 删除 </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </in-tree>
  </div>

  <RoleGroupDrawer ref="RoleGroupDrawerRef" @success="fetchData" />
  <RoleDrawer ref="RoleDrawerRef" :groupList="groupList" @success="fetchData" />
</template>
<script setup lang="ts">
import { TreeKeyAndProps } from "@/models";
import { RoleTypeEnums } from "@/models/enums";
import { Search } from "@element-plus/icons-vue";
import { useRoleStore } from "@/stores/modules/org/role";
import type { RoleTreeNodeVO, Option } from "@/models";
import RoleGroupDrawer from "./RoleGroupDrawer.vue";
import RoleDrawer from "./RoleDrawer.vue";

const roleStore = useRoleStore();
const roleTree = ref<Array<RoleTreeNodeVO>>([]);
const emits = defineEmits(["onNodeClick"]);

const roleTreeRef = ref();
const RoleGroupDrawerRef = ref();
const RoleDrawerRef = ref();
const loading = ref(false);
const searchValue = ref("");
const groupList = ref<Array<Option>>([]);
const defaultExpandedKeys = ref<Array<string>>([]);

watch(searchValue, (val) => {
  roleTreeRef.value!.filter(val);
});

const privateOnNodeClick = (value: RoleTreeNodeVO) => {
  if (value.type == RoleTypeEnums.GROUP) {
    return;
  }
  emits("onNodeClick", value);
};
const privateFilterNode = (value: string, data: RoleTreeNodeVO) => {
  if (!value || !data.name) return true;
  return data.name.indexOf(value) > -1;
};

const fetchData = () => {
  loading.value = true;
  roleStore
    .fetchRoleTree()
    .then((data) => {
      loading.value = false;
      roleTree.value = data;
      groupList.value = roleTree.value
        .filter((item) => item.custom && item.type == RoleTypeEnums.GROUP)
        .map((item) => {
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

const privateHandleRoleCollapseAction = (value: boolean) => {
  privateHandleExpanded(roleTree.value, value);
};
const privateHandleExpanded = (list: Array<RoleTreeNodeVO>, value: boolean) => {
  list.forEach((item) => {
    const node = roleTreeRef.value.getNode(item.id);
    node.expanded = value;
    if (node.parent) {
      node.parent.expanded = value;
    }
    if (item.children && item.children.length) {
      privateHandleExpanded(item.children, value);
    }
  });
};
const privateAllowDrag = (node: any) => {
  return node.data.isGroup;
};
const privateAllowDrop = (draggingNode: any, dropNode: any, type: string) => {
  return dropNode.data.isGroup && type !== "inner";
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const privateOnDropSuccess = (node: any) => {
  const ids = roleTree.value.map((item) => item.id!);
  roleStore.sortRole(ids);
};
const privateOnNodeExpand = (data: any) => {
  defaultExpandedKeys.value.push(data.id);
};
const privateOnNodeCollapse = (data: any) => {
  defaultExpandedKeys.value.splice(defaultExpandedKeys.value.indexOf(data.id), 1);
};

const privateHandleCreateGroup = () => {
  RoleGroupDrawerRef.value.show();
};
const privateHandleCreateRole = () => {
  RoleDrawerRef.value.show();
};
const privateEditRoleOrGroup = (params: RoleTreeNodeVO) => {
  if (params.type == RoleTypeEnums.GROUP) {
    RoleGroupDrawerRef.value.show(params);
  } else {
    RoleDrawerRef.value.show(params);
  }
};
const confirmDeleteGroup = useConfirmDelete(roleStore.removeRole, fetchData);
const confirmDeleteRole = useConfirmDelete(roleStore.removeRole, fetchData);
const privateDeleteRoleOrGroup = (params: RoleTreeNodeVO) => {
  if (params.type == RoleTypeEnums.GROUP) {
    confirmDeleteGroup.exec(params.id!, `是否删除角色组:${params.name}`, "删除成功");
  } else {
    confirmDeleteRole.exec(params.id!, `是否删除角色:${params.name}`, "删除成功");
  }
};

onMounted(() => {
  fetchData();
});
</script>
<style scoped lang="postcss">
.role-filter {
  @apply flex flex-col;

  & .action-box {
    @apply flex flex-row items-center justify-between m-t-[var(--in-common-margin)];
  }

  & .member-role-tree {
    @apply m-t-[var(--in-common-margin)];
  }

  & .role-item {
    @apply flex flex-row items-center gap-2;

    height: 100%;
    width: 100%;

    & .icon {
      color: #39a3ff;
      font-size: 14px;
    }

    & .text {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 14px;
    }

    & .action {
      min-width: 22px;
      & .action-icon {
        font-size: 18px;
      }
      & .action-icon:hover {
        background: #dee1e3;
        border-radius: 4px;
      }
    }
  }
}
</style>
