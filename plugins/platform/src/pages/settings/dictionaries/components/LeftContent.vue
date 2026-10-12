<template>
  <div class="dict-type-filter">
    <el-input
      class="dict-search"
      v-model="searchValue"
      placeholder="搜索字典类型"
      :prefix-icon="Search"
      clearable
    />

    <in-loading :loading="loading" class="dict-type-tree">
      <in-tree
        ref="treeRef"
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
            <in-button
              v-if="hasAction(IamAction.PLATFORM_DICTIONARY_UPDATE)"
              text
              link
              type="primary"
              @click="emits('node-edit-click', data)"
            >
              <template #icon>
                <i-ep:edit />
              </template>
            </in-button>
          </div>
        </template>
      </in-tree>
    </in-loading>
  </div>
</template>
<script setup lang="ts">
import { useCapabilities } from "@ingot/admin-core";
import { IamAction } from "@ingot/admin-common";
const { hasAction } = useCapabilities();
import { Search } from "@element-plus/icons-vue";
import { useQuery } from "@tanstack/vue-query";
import { TreeKeyAndProps, type DictTreeNodeVO, type DictQueryDTO } from "@/models";
import { DictType } from "@/models/enums";
import { DictTreeQueryOptions } from "@/api/settings/dictionaries.query";

const props = defineProps<{
  query?: DictQueryDTO;
  enabled?: boolean;
}>();
const emits = defineEmits<{
  "node-click": [data?: DictTreeNodeVO];
  "node-edit-click": [data?: DictTreeNodeVO];
}>();

const searchValue = ref("");
const treeRef = ref();
const defaultExpandedKeys = ref<Array<string>>([]);

const dictTreeQuery = useQuery(() => ({
  ...DictTreeQueryOptions(() => Object.assign({}, props.query, { type: DictType.Type })),
  enabled: props.enabled !== false && hasAction(IamAction.PLATFORM_DICTIONARY_READ),
}));

const treeData = computed(() =>
  props.enabled !== false && hasAction(IamAction.PLATFORM_DICTIONARY_READ)
    ? (dictTreeQuery.data.value ?? [])
    : [],
);
const loading = computed(() => dictTreeQuery.isFetching.value);

watch(searchValue, (val) => {
  treeRef.value!.filter(val);
});

const privateFilterNode = (value: string, data: DictTreeNodeVO) => {
  if (!value || !data.name) return true;
  return data.name.indexOf(value) > -1;
};

const privateOnNodeClick = (value: DictTreeNodeVO) => {
  emits("node-click", value);
};

const selectFirstNode = (): void => {
  const data = treeData.value;
  defaultExpandedKeys.value = data.map((item) => item.id!);
  nextTick(() => {
    const first = data[0];
    if (first) {
      const node = treeRef.value?.getNode(first);
      node?.store.setCurrentNode(node);
      emits("node-click", first);
    } else {
      emits("node-click", undefined);
    }
  });
};

watch(
  () => dictTreeQuery.dataUpdatedAt.value,
  (updatedAt) => {
    if (!updatedAt) {
      return;
    }
    selectFirstNode();
  },
  { immediate: true },
);

defineExpose({
  refresh: () => dictTreeQuery.refetch(),
});
</script>
<style scoped lang="postcss">
.dict-type-filter {
  @apply flex flex-col gap-10px w-full;
  flex: 1;
  min-height: 0;

  & .dict-type-tree {
    flex: 1;
    min-height: 0;
    overflow: auto;
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
