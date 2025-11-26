<template>
  <div h-full>
    <vue3-tree-org
      ref="treeOrgRef"
      :props="props"
      :data="data"
      :define-menus="defineMenus"
      :default-expand-level="expandLevel"
      center
      :horizontal="horizontal"
      :collapsable="collapsable"
      :only-one-node="onlyOneNode"
      :clone-node-drag="cloneNodeDrag"
    >
      <template v-slot="{ node }">
        <div class="dept-box">
          <div class="dept">
            <div class="label">{{ node.label }}</div>
            <div class="count">部门人数:{{ node.$$data.memberCount }}</div>
          </div>
          <div
            class="manager-box"
            v-if="node.$$data.managerUsers && node.$$data.managerUsers.length > 0"
          >
            <div v-for="(it, index) in node.$$data.managerUsers" :key="index">
              <div flex flex-row items-center gap-1>
                <el-image v-if="it.avatar" class="avatar" :src="it.avatar" fit="cover" />
                <div class="nickname">
                  {{ it.nickname }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="manager-box">
            <el-tag type="info"> 未设置主管 </el-tag>
          </div>
        </div>
      </template>
      <template v-slot:expand="{ node }">
        <div>{{ node.children.length }}</div>
      </template>
    </vue3-tree-org>
  </div>
</template>
<script setup lang="ts">
import type { DeptTreeNode } from "@/models";
import { DeptTree2API } from "@/api/org/dept";

// 定义org组件key-value定义
const props = reactive({
  id: "id",
  pid: "pid",
  label: "name",
  expand: "expand",
  children: "children",
});
const data = ref<DeptTreeNode>({});
const stretchList = ref<Array<DeptTreeNode>>([]);
const defineMenus = reactive([]);

const cloneNodeDrag = ref(true);
const collapsable = ref(false);
const expandLevel = ref(2); //默认展开层级
const horizontal = ref(false);
const onlyOneNode = ref(false);
const treeOrgRef = ref();

const stretch = (tree: Array<any>): Array<DeptTreeNode> => {
  let result: Array<DeptTreeNode> = [];

  tree.forEach((item) => {
    result.push(item);
    if (item.children) {
      result = result.concat(stretch(item.children));
    }
  });

  return result;
};

const fetchData = () => {
  DeptTree2API()
    .then((response) => {
      data.value = response.data[0];
      stretchList.value = stretch(response.data);
    })
    .catch(() => {});
};

onMounted(() => {
  fetchData();
});
</script>
<style lang="postcss" scoped>
.dept-box {
  min-width: 200px;
  border-radius: 10px;

  & .dept {
    @apply flex flex-row items-center justify-between;
    padding: 5px 10px;
    background: rgba(0, 127, 255, 0.12);
    & .label {
      font-size: 12px;
      font-weight: bold;
      color: black;
    }
    & .count {
      font-size: 11px;
      color: #999999;
    }
  }
  & .manager-box {
    @apply flex flex-row gap-2 flex-wrap items-center justify-start;
    min-height: 40px;
    padding: 5px 10px;
    & .avatar {
      @apply w-20px h-20px;
    }
    & .nickname {
      font-size: 12px;
    }
  }
}
</style>
