<template>
  <el-select
    v-model="selectModel"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :remote="remote"
    :remote-method="handleRemoteMethod"
    :loading="loading"
    :disabled="disabled"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    remote-show-suffix
    @change="handleChange"
    @visible-change="handleVisibleChange"
  >
    <el-option
      v-for="item in displayOptions"
      :key="getOptionValue(item)"
      :label="getOptionLabel(item)"
      :value="getOptionValue(item)"
      :disabled="item.disabled"
    >
      <slot name="option" :item="item">
        {{ getOptionLabel(item) }}
      </slot>
    </el-option>

    <!-- 加载更多或没有更多数据的提示 -->
    <template v-if="hasMore" #footer>
      <div class="select-footer">
        <el-button text size="small" :loading="loadingMore" @click="handleLoadMore">
          {{ loadingMore ? "加载中..." : "加载更多" }}
        </el-button>
      </div>
    </template>
  </el-select>
</template>

<script lang="ts" setup>
import type { Page } from "@/models";

interface Props {
  // 占位符
  placeholder?: string;
  // 是否可清空
  clearable?: boolean;
  // 是否禁用
  disabled?: boolean;
  // 是否多选
  multiple?: boolean;
  // 多选时是否折叠标签
  collapseTags?: boolean;
  // 多选折叠时是否显示提示
  collapseTagsTooltip?: boolean;
  // 是否可搜索
  filterable?: boolean;
  // 是否远程搜索
  remote?: boolean;
  // 每页数据条数
  pageSize?: number;
  // 选项的值字段名
  valueField?: string;
  // 选项的标签字段名
  labelField?: string;
  // 加载数据的方法，返回分页数据
  loadData?: (params: LoadDataParams) => Promise<Page<any>>;
  // 初始选项数据
  options?: any[];
  // 默认选中的索引
  defaultSelectIndex?: number;
}

export interface LoadDataParams {
  current: number;
  size: number;
  query?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "请选择",
  clearable: true,
  disabled: false,
  multiple: false,
  collapseTags: false,
  collapseTagsTooltip: true,
  filterable: true,
  remote: true,
  pageSize: 20,
  valueField: "value",
  labelField: "label",
  options: () => [],
  defaultSelectIndex: -1,
});

const emits = defineEmits<{
  change: [value: any];
}>();

const model = defineModel({
  type: String,
});

// 双向绑定
const selectModel = computed({
  get: () => model.value,
  set: (value) => (model.value = value),
});

// 状态管理
const loading = ref(false);
const loadingMore = ref(false);
const currentPage = ref(1);
const totalPages = ref(0);
const searchQuery = ref("");
const allOptions = ref<any[]>([]);
const displayOptions = ref<any[]>([]);

// 是否还有更多数据
const hasMore = computed(() => currentPage.value < totalPages.value);

// 获取选项的值
const getOptionValue = (item: any): any => {
  return (item as any)[props.valueField];
};

// 获取选项的标签
const getOptionLabel = (item: any): string => {
  return (item as any)[props.labelField];
};

// 加载数据
const loadPageData = async (page: number, query?: string, append: boolean = false) => {
  if (!props.loadData) {
    // 如果没有提供 loadData 方法，使用静态选项
    displayOptions.value = props.options;
    return;
  }

  try {
    if (append) {
      loadingMore.value = true;
    } else {
      loading.value = true;
    }

    const result = await props.loadData({
      current: page,
      size: props.pageSize,
      query,
    });

    const records = result.records || [];

    if (append) {
      // 追加数据
      allOptions.value = [...allOptions.value, ...records];
    } else {
      // 重置数据
      allOptions.value = records;
      if (props.defaultSelectIndex >= 0 && !query && !selectModel.value) {
        selectModel.value = getOptionValue(allOptions.value[props.defaultSelectIndex]);
      }
    }

    displayOptions.value = allOptions.value;

    // 更新分页信息
    currentPage.value = page;
    const total = result.total || 0;
    totalPages.value = Math.ceil(total / props.pageSize);
  } catch (error) {
    console.error("加载数据失败:", error);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 处理远程搜索
const handleRemoteMethod = (query?: string) => {
  searchQuery.value = query || "";
  currentPage.value = 1;
  loadPageData(1, query);
};

// 处理加载更多
const handleLoadMore = () => {
  if (!hasMore.value || loadingMore.value) {
    return;
  }
  loadPageData(currentPage.value + 1, searchQuery.value, true);
};

// 处理下拉框显示/隐藏
const handleVisibleChange = (visible: boolean) => {
  if (visible && displayOptions.value.length === 0) {
    // 首次打开时加载数据
    currentPage.value = 1;
    searchQuery.value = "";
    loadPageData(1);
  }
};

// 处理选择改变
const handleChange = (value: any) => {
  selectModel.value = value;
  emits("change", value);
};

// 初始化
onMounted(() => {
  if (props.options && props.options.length > 0) {
    displayOptions.value = props.options;
  }
  handleRemoteMethod();
});

// 监听 options 变化
watch(
  () => props.options,
  (newOptions) => {
    if (newOptions && newOptions.length > 0 && !props.loadData) {
      displayOptions.value = newOptions;
    }
  },
  { deep: true },
);

// 暴露方法供外部调用
defineExpose({
  refresh: () => {
    currentPage.value = 1;
    searchQuery.value = "";
    loadPageData(1);
  },
  loadMore: handleLoadMore,
});
</script>

<style lang="postcss" scoped>
.select-footer {
  @apply flex items-center justify-center;

  .no-more-text {
    @apply text-sm text-gray-400;
  }
}
</style>
