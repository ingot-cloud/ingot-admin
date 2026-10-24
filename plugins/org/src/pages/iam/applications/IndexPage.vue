<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="查看开通应用并配置可用人群。人群不等于业务授权。" />
    </template>
    <div class="app-board">
      <el-input
        v-model="paging.condition.name"
        class="app-board__search"
        clearable
        placeholder="搜索应用名"
        :prefix-icon="Search"
        @keyup.enter="refreshData"
        @clear="refreshData"
      />
      <in-loading class="app-board__body" :loading="paging.fetching.value">
        <div v-if="records.length" class="app-grid" role="list">
          <button
            v-for="item in records"
            :key="item.record.id"
            type="button"
            class="app-card"
            role="listitem"
            :disabled="!detailAccess(item).allowed"
            :title="detailAccess(item).message"
            :aria-label="applicationLabel(item)"
            @click="privateOnOpen(item)"
          >
            <in-application-icon :icon="item.record.icon" class="app-card__icon" />
            <span class="app-card__name">{{ applicationLabel(item) }}</span>
          </button>
        </div>
        <el-empty
          v-else-if="!paging.loading.value"
          :image="noContentIllustration"
          :image-size="120"
          :description="emptyDescription"
        />
      </in-loading>
      <el-pagination
        v-if="paging.pageInfo.value.total > 0"
        class="app-board__pager"
        background
        :current-page="paging.pageInfo.value.current"
        :page-size="paging.pageInfo.value.size"
        :page-sizes="APPLICATION_GRID_PAGE_SIZES"
        :total="paging.pageInfo.value.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="privateOnSize"
        @current-change="privateOnPage"
      />
    </div>
  </in-page-frame>

  <ApplicationDetailDrawer ref="detailRef" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import { noContentIllustration } from "@ingot/admin-core";
import ApplicationDetailDrawer from "./components/ApplicationDetailDrawer.vue";
import { APPLICATION_GRID_PAGE_SIZES, applicationLabel, detailAccess, type Row } from "./table";
import { useOps } from "./useOps";

const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const detailRef = ref<{ show: (row: Row) => void }>();

const records = computed(() => paging.pageInfo.value.records);
const emptyDescription = computed(() => {
  if (unavailable.value) {
    return "加载失败";
  }
  const name = paging.submitted.value.name?.trim();
  return name ? "无搜索结果" : "暂无数据";
});

const privateOnOpen = (item: Row): void => {
  if (!detailAccess(item).allowed) {
    return;
  }
  detailRef.value?.show(item);
};
const privateOnSize = (value: number): void => {
  paging.fetchData({ value, type: "size" });
};
const privateOnPage = (value: number): void => {
  paging.fetchData({ value, type: "current" });
};
</script>

<style lang="postcss" scoped>
.app-board {
  @apply flex flex-col min-w-0 w-full box-border;
  height: 100%;
  min-height: 0;
  padding: var(--in-space-5);
  gap: var(--in-space-5);
}

.app-board__search {
  @apply flex-none;
  width: 200px;
}

.app-board__body {
  @apply flex flex-col min-w-0;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--in-space-3);
  align-content: start;
}

.app-card {
  @apply flex flex-col items-center justify-center min-w-0;
  margin: 0;
  padding: var(--in-space-4) var(--in-space-2);
  border: 0;
  border-radius: var(--in-radius-card);
  background: transparent;
  color: var(--in-text-color);
  cursor: pointer;
  gap: var(--in-space-2);
}

.app-card:hover:not(:disabled) {
  background: var(--in-bg-color-hover);
}

.app-card:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.app-card:disabled {
  color: var(--in-text-color-disabled);
  cursor: not-allowed;
}

.app-card__icon {
  font-size: 40px;
  color: inherit;
}

.app-card__name {
  width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  text-align: center;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.app-board__pager {
  @apply flex flex-row justify-end;
  flex: none;
}
</style>
