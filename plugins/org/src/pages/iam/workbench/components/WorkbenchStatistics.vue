<template>
  <section class="workbench-statistics" aria-label="组织概况" :aria-busy="loading">
    <header class="workbench-statistics__header">
      <in-avatar
        class="workbench-statistics__avatar"
        :src="statistics?.tenantAvatar"
        :name="statistics?.tenantName || '组织'"
        :size="48"
        :show-name="false"
      />
      <div class="min-w-0 flex-1">
        <h2>{{ statistics?.tenantName || "组织概况" }}</h2>
        <p class="workbench-statistics__scope">统计按当前可见范围展示</p>
      </div>
    </header>
    <in-loading :loading="loading" class="workbench-statistics__body">
      <div v-if="failed" class="workbench-statistics__error" role="alert">
        <p>暂时无法加载组织统计</p>
        <in-button @click="$emit('retry')">重新加载</in-button>
      </div>
      <dl v-else class="workbench-statistics__metrics">
        <div v-for="metric in WORKBENCH_METRICS" :key="metric.key" :title="metric.description">
          <dt>{{ metric.label }}</dt>
          <dd
            :aria-label="
              statistics && statistics[metric.key] === undefined ? '无查看权限' : undefined
            "
          >
            {{ statistics?.[metric.key]?.toLocaleString() ?? "—" }}
          </dd>
        </div>
      </dl>
    </in-loading>
  </section>
</template>

<script lang="ts" setup>
import type { TenantWorkbenchStatistics } from "@/models/workbench";
import { WORKBENCH_METRICS } from "../table";

defineProps<{ statistics?: TenantWorkbenchStatistics; loading: boolean; failed: boolean }>();
defineEmits<{ retry: [] }>();
</script>

<style lang="postcss" scoped>
.workbench-statistics {
  @apply flex flex-col min-w-0;
  padding: var(--in-space-5);
  border: 1px solid var(--in-bg-color-surface);
  border-radius: var(--in-radius-card-lg);
  background:
    radial-gradient(
      ellipse at right bottom,
      color-mix(in srgb, var(--in-color-primary) 5%, transparent),
      transparent 65%
    ),
    color-mix(in srgb, var(--in-bg-color-surface) 20%, var(--in-bg-color-canvas));
}
.workbench-statistics__header {
  @apply flex items-center min-w-0;
  min-height: 52px;
  gap: var(--in-space-3);
  padding-bottom: var(--in-space-6);
  border-bottom: 1px solid var(--in-border-color);
}
.workbench-statistics__avatar {
  flex: none;
}
.workbench-statistics__avatar :deep(.in-avatar) {
  border-radius: var(--in-radius-card-lg);
}
.workbench-statistics__header h2 {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  line-height: var(--in-line-height-section-title);
  font-weight: var(--in-font-weight-section-title);
}
.workbench-statistics__scope {
  margin: var(--in-space-1) 0 0;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}
.workbench-statistics__body {
  flex: 1;
  min-height: 84px;
}
.workbench-statistics__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--in-space-5);
  margin: 0;
  padding: var(--in-space-6) var(--in-space-1) 0;
}
.workbench-statistics__metrics dt {
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}
.workbench-statistics__metrics dd {
  margin: var(--in-space-1) 0 0;
  color: var(--in-text-color);
  font-size: 24px;
  line-height: 28px;
  font-weight: var(--in-font-weight-page-title);
  font-variant-numeric: tabular-nums;
}
.workbench-statistics__error {
  @apply flex flex-wrap items-center justify-between;
  gap: var(--in-space-3);
  padding-top: var(--in-space-5);
  color: var(--in-text-color-secondary);
}
.workbench-statistics__error p {
  margin: 0;
}
@container workbench (max-width: 560px) {
  .workbench-statistics__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
