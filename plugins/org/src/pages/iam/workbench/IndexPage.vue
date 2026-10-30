<template>
  <in-page-frame mode="page">
    <div class="workbench">
      <div class="workbench__grid">
        <workbench-statistics
          class="workbench__statistics"
          :statistics="statistics"
          :loading="loading"
          :failed="failed"
          @retry="retry"
        />
        <workbench-todos class="workbench__todos" />
        <workbench-shortcuts class="workbench__shortcuts" :entries="entries" />
      </div>
    </div>
  </in-page-frame>
</template>

<script lang="ts" setup>
import WorkbenchShortcuts from "./components/WorkbenchShortcuts.vue";
import WorkbenchStatistics from "./components/WorkbenchStatistics.vue";
import WorkbenchTodos from "./components/WorkbenchTodos.vue";
import { useOps } from "./useOps";

const { entries, statistics, loading, failed, retry } = useOps();
</script>

<style lang="postcss" scoped>
.workbench {
  container: workbench / inline-size;
  min-width: 0;
}

.workbench__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--in-space-3);
  align-items: stretch;
}

.workbench__statistics {
  grid-column: span 3;
}

.workbench__todos {
  grid-column: span 1;
}

.workbench__shortcuts {
  grid-column: 1 / -1;
}

@container workbench (max-width: 900px) {
  .workbench__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .workbench__statistics,
  .workbench__todos {
    grid-column: 1;
  }
}
</style>
