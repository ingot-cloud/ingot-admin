<template>
  <section class="workbench-shortcuts" aria-labelledby="workbench-shortcuts-title">
    <h2 id="workbench-shortcuts-title">快捷入口</h2>
    <div v-if="entries.length" class="workbench-shortcuts__grid">
      <router-link
        v-for="entry in entries"
        :key="entry.path"
        :to="entry.path"
        class="workbench-shortcut"
        :title="[...entry.ancestors, entry.title].join(' / ')"
      >
        <span class="workbench-shortcut__icon" aria-hidden="true">
          <in-icon :name="entry.icon || WORKBENCH_FALLBACK_ICON" />
        </span>
        <span class="workbench-shortcut__copy">
          <span class="workbench-shortcut__title">{{ entry.title }}</span>
          <span v-if="entry.ancestors.length" class="workbench-shortcut__parent">{{
            entry.ancestors.join(" / ")
          }}</span>
        </span>
      </router-link>
    </div>
    <p v-else class="workbench-shortcuts__empty">当前没有可用的快捷入口</p>
  </section>
</template>

<script lang="ts" setup>
import { WORKBENCH_FALLBACK_ICON, type WorkbenchEntry } from "../table";
defineProps<{ entries: WorkbenchEntry[] }>();
</script>

<style lang="postcss" scoped>
.workbench-shortcuts {
  min-width: 0;
}
.workbench-shortcuts h2 {
  margin: var(--in-space-2) 0 var(--in-space-3);
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  line-height: var(--in-line-height-section-title);
  font-weight: var(--in-font-weight-section-title);
}
.workbench-shortcuts__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--in-space-3);
}
.workbench-shortcut {
  @apply flex items-center min-w-0 box-border no-underline;
  min-height: 64px;
  gap: var(--in-space-3);
  padding: var(--in-space-3);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card-lg);
  background: var(--in-bg-color-surface);
  color: var(--in-text-color);
  transition:
    transform var(--in-motion-duration),
    box-shadow var(--in-motion-duration);
}
.workbench-shortcut:hover,
.workbench-shortcut:focus-visible {
  transform: translateY(-2px);
  box-shadow: var(--in-shadow-md);
  color: var(--in-color-primary);
}
.workbench-shortcut:focus-visible {
  outline: 2px solid var(--in-focus-ring-color);
  outline-offset: 2px;
}
.workbench-shortcut__icon {
  @apply flex items-center justify-center flex-none w-40px h-40px text-20px;
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-subtle);
}
.workbench-shortcut__copy {
  @apply flex flex-col min-w-0;
}
.workbench-shortcut__title {
  overflow-wrap: anywhere;
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
  font-weight: var(--in-font-weight-section-title);
}
.workbench-shortcut__parent {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-caption);
}
.workbench-shortcuts__empty {
  margin: 0;
  padding: var(--in-space-5);
  color: var(--in-text-color-secondary);
}
@container workbench (max-width: 900px) {
  .workbench-shortcuts__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container workbench (max-width: 560px) {
  .workbench-shortcuts__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (prefers-reduced-motion: reduce) {
  .workbench-shortcut:hover,
  .workbench-shortcut:focus-visible {
    transform: none;
  }
}
</style>
