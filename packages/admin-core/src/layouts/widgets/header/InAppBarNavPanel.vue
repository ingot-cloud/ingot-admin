<template>
  <div class="in-app-bar-nav-panel" :class="{ 'is-single': single }">
    <section v-for="group in groups" :key="group.key" class="in-app-bar-nav-panel__group">
      <h3 class="in-app-bar-nav-panel__title">{{ group.title }}</h3>
      <div class="in-app-bar-nav-panel__items" :style="privateGridStyle(group)">
        <button
          v-for="entry in group.items"
          :key="entry.key"
          type="button"
          class="in-app-bar-nav-panel__item"
          :class="{ 'is-disabled': entry.disabled, 'is-active': entry.key === activeKey }"
          :disabled="entry.disabled"
          :role="itemRole"
          :aria-current="entry.key === activeKey ? 'page' : undefined"
          @click="privateOnSelect(entry)"
        >
          <InApplicationIcon
            v-if="entry.icon"
            :icon="entry.icon"
            class="in-app-bar-nav-panel__icon"
          />
          <span class="in-app-bar-nav-panel__label">{{ entry.label }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import InApplicationIcon from "./InApplicationIcon.vue";
import type { ResolvedHeaderNavGroup, ResolvedHeaderNavMenuItem } from "./resolveHeaderConfig";

defineOptions({ name: "InAppBarNavPanel" });

const props = defineProps<{
  groups: ResolvedHeaderNavGroup[];
  single?: boolean;
  activeKey?: string;
  itemRole?: "menuitem";
}>();
const emit = defineEmits<{ select: [entry: ResolvedHeaderNavMenuItem] }>();

const privateGridStyle = (group: ResolvedHeaderNavGroup): Record<string, string> => {
  const columns = props.single ? 1 : group.columns;
  return {
    "--in-nav-group-columns": String(columns),
    "--in-nav-group-rows": String(Math.max(1, Math.ceil(group.items.length / columns))),
  };
};

const privateOnSelect = (entry: ResolvedHeaderNavMenuItem) => {
  if (!entry.disabled) emit("select", entry);
};
</script>
<style lang="postcss" scoped>
.in-app-bar-nav-panel {
  @apply flex flex-wrap items-start;
  width: max-content;
  max-width: 100%;
  gap: var(--in-space-8);
}

.in-app-bar-nav-panel.is-single {
  flex-direction: column;
  flex-wrap: nowrap;
  gap: var(--in-space-5);
}

.in-app-bar-nav-panel__group {
  flex: none;
  width: max-content;
  max-width: 100%;
  min-width: 0;
}

.in-app-bar-nav-panel__title {
  margin: 0;
  padding: 0 0 var(--in-space-3);
  border-bottom: 1px solid var(--in-border-color);
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  white-space: nowrap;
}

.in-app-bar-nav-panel__items {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(var(--in-nav-group-rows, 1), auto);
  grid-template-columns: repeat(var(--in-nav-group-columns, 1), minmax(0, 160px));
  column-gap: var(--in-space-2);
  row-gap: var(--in-space-1);
  margin-top: var(--in-space-3);
}

.in-app-bar-nav-panel__item {
  @apply flex items-center min-w-0;
  box-sizing: border-box;
  width: 160px;
  max-width: 100%;
  height: 42px;
  margin: 0;
  padding: 0 var(--in-space-3);
  border: 0;
  border-radius: var(--in-radius-card);
  background: transparent;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  cursor: pointer;
  gap: 6px;
}

.in-app-bar-nav-panel__item.is-active {
  font-weight: var(--in-font-weight-section-title);
  background: color-mix(in srgb, var(--in-text-color) 6%, transparent);
}

.in-app-bar-nav-panel__item.is-disabled {
  color: var(--in-text-color-disabled);
  cursor: not-allowed;
}

.in-app-bar-nav-panel__item:hover:not(.is-disabled) {
  background: var(--in-bg-color-hover);
}

.in-app-bar-nav-panel__item:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}

.in-app-bar-nav-panel__label {
  @apply flex-1 min-w-0 overflow-hidden whitespace-nowrap text-left;
  text-overflow: ellipsis;
}

.in-app-bar-nav-panel__icon {
  @apply flex-none;
  width: 16px;
  height: 16px;
  font-size: 16px;
  color: inherit;
}
</style>
