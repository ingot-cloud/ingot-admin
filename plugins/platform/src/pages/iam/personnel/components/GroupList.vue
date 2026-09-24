<template>
  <div class="group-list">
    <div class="action-box">
      <el-input
        v-model="name"
        class="action-box__search"
        clearable
        placeholder="搜索组名"
        :prefix-icon="Search"
        @keyup.enter="emits('search')"
        @clear="emits('search')"
      />
    </div>
    <div class="group-list__body">
      <div
        v-for="item in records"
        :key="item.record.id"
        role="button"
        tabindex="0"
        class="group-item"
        :class="{ 'is-selected': item.record.id === selectedId }"
        @click="emits('select', item)"
        @keydown.enter="emits('select', item)"
      >
        <icon-group-outlined class="group-item__icon" />
        <span class="group-item__text">{{ item.record.name || item.record.id }}</span>
        <div class="group-item__action">
          <el-dropdown trigger="hover">
            <button type="button" class="group-item__more" aria-label="更多" @click.stop>
              <icon-more-outlined class="group-item__more-icon" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="emits('detail', item)">查看用户组详情</el-dropdown-item>
                <el-dropdown-item :disabled="!canDelete(item)" @click="emits('delete', item)">
                  <span class="group-item__danger">删除用户组</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div v-if="!records.length && !loading" class="group-list__empty">暂无用户组</div>
    </div>
    <el-pagination
      v-if="(total ?? 0) > (size ?? IAM_DEFAULT_PAGE_SIZE)"
      class="justify-center"
      small
      layout="prev, next"
      :current-page="current"
      :page-size="size"
      :total="total"
      @current-change="privateOnPage"
    />
    <in-button type="primary" :disabled="!canCreate" @in-click="emits('create')">新建用户组</in-button>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { IAM_DEFAULT_PAGE_SIZE, IamAction, objectActionAllowed } from "@ingot/admin-common";
import type { GroupRow } from "../groupTable";
import IconGroupOutlined from "./IconGroupOutlined.vue";

defineOptions({ name: "GroupList" });

const name = defineModel<string>("name", { default: "" });
defineProps<{
  records: GroupRow[];
  selectedId: string;
  loading: boolean;
  current: number;
  size: number;
  total: number;
  canCreate: boolean;
}>();
const emits = defineEmits<{
  search: [];
  select: [row: GroupRow];
  detail: [row: GroupRow];
  delete: [row: GroupRow];
  create: [];
  page: [current: number];
}>();

const canDelete = (item: GroupRow): boolean =>
  objectActionAllowed(item.capabilities, IamAction.PLATFORM_GROUP_DELETE).allowed;

const privateOnPage = (current: number): void => {
  emits("page", current);
};
</script>

<style scoped lang="postcss">
.group-list {
  @apply h-full min-h-0 flex flex-col gap-12px;

  & .action-box {
    @apply flex flex-row items-center;
  }

  & .action-box__search {
    flex: 1 1 0;
    min-width: 0;
  }

  & .group-list__body {
    @apply flex-1 min-h-0 overflow-auto;
  }

  & .group-list__empty {
    color: var(--in-text-color-secondary);
    padding: 16px 0;
  }

  & .group-item {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 36px;
    margin-bottom: 4px;
    min-width: 0;
    overflow: visible;
    padding: 0 4px 0 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #1f2329;
    text-align: left;
    cursor: pointer;
  }

  & .group-item:hover {
    background: rgba(126, 134, 142, 0.08);
  }

  & .group-item.is-selected {
    color: rgb(51, 112, 255);
    background: rgba(51, 112, 255, 0.08);
  }

  & .group-item__icon {
    flex: none;
    font-size: 14px;
  }

  & .group-item__text {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 14px;
  }

  & .group-item__action {
    flex: 0 0 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    min-width: 24px;
    overflow: visible;
    line-height: 0;
  }

  & .group-item__action :deep(.el-dropdown),
  & .group-item__action :deep(.el-tooltip__trigger) {
    display: inline-flex;
    flex: none;
    line-height: 0;
  }

  & .group-item__more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  & .group-item__more-icon {
    display: block;
    width: 1em;
    height: 1em;
    font-size: 16px;
  }

  & .group-item__more:hover {
    background: #dee1e3;
  }

  & .group-item__danger {
    color: var(--in-color-danger);
  }
}
</style>
