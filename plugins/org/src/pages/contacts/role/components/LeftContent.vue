<template>
  <div class="role-filter">
    <div class="action-box">
      <el-input
        v-model="searchValue"
        class="action-box__search"
        placeholder="搜索角色"
        :prefix-icon="Search"
        clearable
      />
      <el-dropdown trigger="click">
        <button type="button" class="more-trigger" aria-label="更多">
          <el-icon>
            <i-material-symbols:more-vert />
          </el-icon>
        </button>
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
    <div class="action-box">
      <div class="action-box__start">
        <in-button type="primary" plain @click="privateHandleCreateGroup">新增角色组</in-button>
        <in-button @click="privateHandleCreateRole">新增角色</in-button>
      </div>
    </div>

    <in-loading :loading="loading" class="member-role-tree">
      <in-tree
        ref="roleTreeRef"
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
            v-if="data.type === RoleTypeEnums.GROUP"
            name="mingcute:group-line"
            class="icon"
          />
          <in-icon v-else name="tabler:user" class="icon" />
          <span class="text">
            {{ node.label }}
            <in-tag v-if="data.filterDept" :value="{ text: '部门角色', tag: 'info' }" />
          </span>

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
    </in-loading>
  </div>

  <RoleGroupDrawer ref="RoleGroupDrawerRef" @success="fetchData" />
  <RoleDrawer ref="RoleDrawerRef" :groupList="groupList" @success="fetchData" />
</template>
<script setup lang="ts">
import { TreeKeyAndProps } from "@/models";
import { RoleTypeEnums } from "@/models/enums";
import { Search } from "@element-plus/icons-vue";
import type { RoleTreeNodeVO, Option } from "@/models";
import { RemoveRoleAPI, RoleSortAPI } from "@/api/org/role";
import { OrgRoleTreeQueryOptions, orgRoleQueryKeys } from "@/api/org/role.query";
import { Confirm, Message } from "@ingot/admin-core";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import RoleGroupDrawer from "./RoleGroupDrawer.vue";
import RoleDrawer from "./RoleDrawer.vue";

const queryClient = useQueryClient();
const roleQuery = useQuery(() => OrgRoleTreeQueryOptions());
const roleTree = computed(() => roleQuery.data.value ?? []);
const loading = computed(() => roleQuery.isFetching.value);
const groupList = computed<Array<Option>>(() =>
  roleTree.value
    .filter((item) => item.custom && item.type === RoleTypeEnums.GROUP)
    .map((item) => ({
      value: item.id!,
      label: item.name!,
    })),
);
const emits = defineEmits<{
  "node-click": [value: RoleTreeNodeVO];
}>();

const roleTreeRef = ref();
const RoleGroupDrawerRef = ref();
const RoleDrawerRef = ref();
const searchValue = ref("");
const defaultExpandedKeys = ref<Array<string>>([]);

watch(searchValue, (val) => {
  roleTreeRef.value!.filter(val);
});

const privateOnNodeClick = (value: RoleTreeNodeVO) => {
  if (value.type === RoleTypeEnums.GROUP) {
    return;
  }
  emits("node-click", value);
};
const privateFilterNode = (value: string, data: RoleTreeNodeVO) => {
  if (!value || !data.name) return true;
  return data.name.indexOf(value) > -1;
};

const fetchData = () => {
  void queryClient.invalidateQueries({ queryKey: orgRoleQueryKeys.lists() });
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
const privateAllowDrag = (node: { data: RoleTreeNodeVO }) => {
  return Boolean(node.data.isGroup);
};
const privateAllowDrop = (
  _draggingNode: { data: RoleTreeNodeVO },
  dropNode: { data: RoleTreeNodeVO },
  type: string,
) => {
  return Boolean(dropNode.data.isGroup) && type !== "inner";
};

const privateOnDropSuccess = () => {
  const ids = roleTree.value.map((item) => item.id!);
  RoleSortAPI(ids).then(() => {
    void queryClient.invalidateQueries({ queryKey: orgRoleQueryKeys.lists() });
  });
};
const privateOnNodeExpand = (data: RoleTreeNodeVO) => {
  if (data.id) {
    defaultExpandedKeys.value.push(data.id);
  }
};
const privateOnNodeCollapse = (data: RoleTreeNodeVO) => {
  if (!data.id) {
    return;
  }
  defaultExpandedKeys.value.splice(defaultExpandedKeys.value.indexOf(data.id), 1);
};

const privateHandleCreateGroup = () => {
  RoleGroupDrawerRef.value.show();
};
const privateHandleCreateRole = () => {
  RoleDrawerRef.value.show();
};
const privateEditRoleOrGroup = (params: RoleTreeNodeVO) => {
  if (params.type === RoleTypeEnums.GROUP) {
    RoleGroupDrawerRef.value.show(params);
  } else {
    RoleDrawerRef.value.show(params);
  }
};
const privateDeleteRoleOrGroup = (params: RoleTreeNodeVO) => {
  const isGroup = params.type === RoleTypeEnums.GROUP;
  const message = isGroup ? `是否删除角色组:${params.name}` : `是否删除角色:${params.name}`;
  Confirm.warning(message).then(() => {
    RemoveRoleAPI(params.id!).then(() => {
      Message.success("删除成功");
      fetchData();
    });
  });
};
</script>
<style scoped lang="postcss">
.role-filter {
  @apply flex flex-col min-w-0 w-full;

  & .action-box {
    @apply flex flex-row items-center justify-between m-t-[var(--in-common-margin)];
  }

  & .action-box:first-child {
    @apply flex flex-row items-center justify-between;
    margin-top: 0 !important;
  }

  & .action-box :deep(.action-box__search) {
    flex: 1 1 0;
    min-width: 0;
    width: auto;
  }

  & .more-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--in-control-height);
    height: var(--in-control-height);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--in-text-color-secondary);
    cursor: pointer;
  }

  & :deep(.el-dropdown) {
    display: inline-flex;
    align-items: center;
    line-height: 0;
  }

  & :deep(.el-divider--vertical) {
    align-self: center;
    height: 16px;
    margin: 0;
  }

  & .member-role-tree {
    @apply m-t-[var(--in-common-margin)];
  }

  & .role-item {
    @apply flex flex-row items-center gap-2;

    height: 100%;
    width: 100%;

    & .icon {
      flex: none;
      color: var(--in-color-primary);
      font-size: 14px;
    }

    & .text {
      flex: 1;
      min-width: 0;
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
