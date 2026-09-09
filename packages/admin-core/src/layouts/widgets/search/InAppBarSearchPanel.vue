<template>
  <div
    class="in-app-bar-search-panel"
    :class="{ 'is-inline': inline }"
    data-testid="app-bar-search-panel"
    role="listbox"
  >
    <div v-if="showHistory" class="in-app-bar-search-panel__history" data-testid="app-bar-search-history">
      <div class="in-app-bar-search-panel__history-head">
        <span class="in-app-bar-search-panel__history-title">搜索历史</span>
        <button
          type="button"
          class="in-app-bar-search-panel__clear"
          aria-label="清空搜索历史"
          @click.stop="emit('clear-history')"
        >
          <in-icon name="ingot:delete-trash-outlined" />
        </button>
      </div>
      <div class="in-app-bar-search-panel__chips">
        <button
          v-for="item in history"
          :key="item"
          type="button"
          class="in-app-bar-search-panel__chip"
          @click.stop="emit('apply-history', item)"
        >
          {{ item }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="in-app-bar-search-panel__loading" data-testid="app-bar-search-loading">
      <in-loading-mark :size="48" />
    </div>

    <div
      v-else-if="hasQuery"
      class="in-app-bar-search-panel__section"
      data-testid="app-bar-search-results"
    >
      <div class="in-app-bar-search-panel__history-title">功能</div>
      <p v-if="results.length === 0" class="in-app-bar-search-panel__empty">未找到匹配的菜单</p>
      <in-app-bar-search-hit
        v-for="(item, index) in results"
        :key="item.path"
        :title="item.title"
        :description="item.ancestors.join(' > ') || undefined"
        :icon="item.icon"
        :keyword="keyword"
        :active="highlightedIndex === index"
        @select="emit('select', item)"
      />
    </div>

    <div
      v-else-if="shortcuts.length > 0"
      class="in-app-bar-search-panel__section"
      data-testid="app-bar-search-shortcuts"
    >
      <div class="in-app-bar-search-panel__history-title">常用</div>
      <in-app-bar-search-hit
        v-for="(item, index) in shortcuts"
        :key="item.key"
        :title="item.label"
        :description="item.description"
        :icon="item.icon"
        :active="highlightedIndex === index"
        @select="emit('pick-shortcut', item)"
      />
    </div>

    <div
      v-else
      class="in-app-bar-search-panel__placeholder"
      data-testid="app-bar-search-placeholder"
    >
      <in-icon name="ep:search" class="in-app-bar-search-panel__placeholder-icon" />
      <span>{{ emptyHint }}</span>
    </div>

    <div class="in-app-bar-search-panel__footer">
      <span class="in-app-bar-search-panel__hint">↑↓ 移动光标 | Enter 选择条目</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { FlattenedMenuItem } from "./flattenMenus";
import type { ResolvedHeaderSearchShortcut } from "../header/resolveHeaderConfig";
import InAppBarSearchHit from "./InAppBarSearchHit.vue";
import InLoadingMark from "@/components/InLoadingMark.vue";

defineOptions({
  name: "InAppBarSearchPanel",
});

withDefaults(
  defineProps<{
    showHistory: boolean;
    hasQuery: boolean;
    loading?: boolean;
    history: string[];
    results: FlattenedMenuItem[];
    shortcuts?: ResolvedHeaderSearchShortcut[];
    keyword?: string;
    emptyHint: string;
    highlightedIndex: number;
    inline?: boolean;
  }>(),
  {
    loading: false,
    shortcuts: () => [],
    keyword: "",
    inline: false,
  },
);

const emit = defineEmits<{
  "apply-history": [keyword: string];
  "clear-history": [];
  select: [item: FlattenedMenuItem];
  "pick-shortcut": [item: ResolvedHeaderSearchShortcut];
}>();
</script>
<style lang="postcss" scoped>
.in-app-bar-search-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-height: inherit;
  overflow: hidden;
  padding: var(--in-space-3) var(--in-space-3) 0;
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-surface);
  box-shadow: var(--in-shadow-overlay);
}

.in-app-bar-search-panel.is-inline {
  margin-top: var(--in-space-3);
  padding: 0;
  border: none;
  box-shadow: none;
}

.in-app-bar-search-panel__history {
  margin-bottom: var(--in-space-3);
}

.in-app-bar-search-panel__history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--in-space-2);
}

.in-app-bar-search-panel__history-title {
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  height: var(--in-line-height-body);
}

.in-app-bar-search-panel__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--in-text-color-placeholder);
  cursor: pointer;

  &:hover {
    color: var(--in-text-color-secondary);
  }
}

.in-app-bar-search-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--in-space-2);
  min-width: 0;
}

.in-app-bar-search-panel__chip {
  box-sizing: border-box;
  max-width: calc(33.333% - 8px);
  height: 30px;
  padding: 4px 16px;
  overflow: hidden;
  border: 0;
  border-radius: 43px;
  background: var(--in-gray-100);
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: var(--in-bg-color-control-hover);
  }
}

.in-app-bar-search-panel__section {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-1);
  min-height: 0;
  max-height: 280px;
  overflow: auto;
}

.in-app-bar-search-panel__loading,
.in-app-bar-search-panel__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--in-space-2);
  min-height: 120px;
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}

.in-app-bar-search-panel__loading {
  color: var(--in-color-primary);
}

.in-app-bar-search-panel__placeholder-icon {
  font-size: 28px;
}

.in-app-bar-search-panel__empty {
  margin: 0;
  padding: var(--in-space-3) var(--in-space-2);
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}

.in-app-bar-search-panel__footer {
  display: flex;
  flex: none;
  align-items: center;
  height: 36px;
  margin: var(--in-space-3) calc(var(--in-space-3) * -1) 0;
  padding: 0 var(--in-space-5);
  background: var(--in-bg-color-muted);
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  font-weight: var(--in-font-weight-body);
  line-height: 20px;
}

.is-inline .in-app-bar-search-panel__footer {
  margin-left: calc(var(--in-space-3) * -1);
  margin-right: calc(var(--in-space-3) * -1);
  margin-bottom: calc(var(--in-space-3) * -1);
}

.in-app-bar-search-panel__hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
}
</style>
