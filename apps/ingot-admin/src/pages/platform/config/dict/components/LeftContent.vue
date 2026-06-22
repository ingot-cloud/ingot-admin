<template>
  <div class="dict-type-filter">
    <div class="in-custom-title">
      <div class="rect" />
      <div class="title">字典类型</div>
      <div class="actions">
        <in-refresh-icon size="18" @refresh="fetchData" />
      </div>
    </div>

    <el-input
      class="dict-search"
      v-model="searchValue"
      placeholder="搜索字典类型"
      :prefix-icon="Search"
      clearable
    />

    <in-tree
      v-loading="loading"
      ref="treeRef"
      class="dict-type-tree"
      :data="treeData"
      :props="TreeKeyAndProps.props"
      :node-key="TreeKeyAndProps.nodeKey"
      :filter-node-method="privateFilterNode"
      :default-expanded-keys="defaultExpandedKeys"
      @node-click="privateOnNodeClick"
    >
      <template #default="{ data }">
        <div class="dict-type-item">
          <i-carbon:list-boxes class="icon" />
          <span class="text" :title="data.name">{{ data.name }}</span>
          <el-tag v-if="data.systemFlag" size="small" type="warning" effect="plain" class="badge">
            系统
          </el-tag>
          <in-button text link type="primary" @click="emits('onNodeEditClick', data)">
            <template #icon>
              <i-ep:edit />
            </template>
          </in-button>
        </div>
      </template>
    </in-tree>
  </div>
</template>
<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { TreeKeyAndProps, type DictTreeNodeVO, type DictQueryDTO } from "@/models";
import { DictType } from "@/models/enums";
import { GetDictTreeAPI } from "@/api/platform/config/dict";

const props = defineProps<{
  query?: DictQueryDTO;
}>();
const emits = defineEmits<{
  (e: "onNodeClick", data?: DictTreeNodeVO): void;
  (e: "onNodeEditClick", data?: DictTreeNodeVO): void;
}>();

const loading = ref(false);
const searchValue = ref("");
const treeRef = ref();
const treeData = ref<Array<DictTreeNodeVO>>([]);
const defaultExpandedKeys = ref<Array<string>>([]);

watch(searchValue, (val) => {
  treeRef.value!.filter(val);
});

const privateFilterNode = (value: string, data: DictTreeNodeVO) => {
  if (!value || !data.name) return true;
  return data.name.indexOf(value) > -1;
};

const privateOnNodeClick = (value: DictTreeNodeVO) => {
  emits("onNodeClick", value);
};

const fetchData = (): void => {
  loading.value = true;
  // 树仅用于展示字典类型，过滤掉字典项
  const params = Object.assign({}, props.query, { type: DictType.Type });
  GetDictTreeAPI(params)
    .then((response) => {
      loading.value = false;
      treeData.value = response.data || [];
      defaultExpandedKeys.value = treeData.value.map((item) => item.id!);

      nextTick(() => {
        const first = treeData.value[0];
        if (first) {
          const node = treeRef.value.getNode(first);
          node?.store.setCurrentNode(node);
          emits("onNodeClick", first);
        } else {
          emits("onNodeClick", undefined);
        }
      });
    })
    .catch(() => {
      loading.value = false;
    });
};

watch(
  () => props.query,
  () => fetchData(),
  { deep: true },
);

onMounted(() => {
  fetchData();
});

defineExpose({
  refresh: fetchData,
});
</script>
<style scoped lang="postcss">
.dict-type-filter {
  @apply flex flex-col gap-10px w-260px;

  & .in-custom-title {
    @apply flex flex-row items-center gap-2;
    padding-bottom: var(--in-common-padding);
    border-bottom: var(--in-border-style);
    & .rect {
      width: 4px;
      height: 14px;
      background: var(--in-color-primary);
      border-radius: 2px;
    }
    & .title {
      flex: 1;
      font-weight: bold;
      color: #192f48;
      font-size: 16px;
    }
  }

  & .dict-type-tree {
    @apply m-t-[var(--in-common-margin)];
  }

  & .dict-type-item {
    @apply flex flex-row items-center gap-2 w-full;
    & .icon {
      flex-shrink: 0;
      color: var(--in-color-primary);
    }
    & .text {
      flex: 1;
      max-width: 160px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 14px;
    }
    & .badge {
      flex-shrink: 0;
    }
  }
}
</style>
