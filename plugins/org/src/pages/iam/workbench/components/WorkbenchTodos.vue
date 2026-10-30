<template>
  <section class="workbench-todos" aria-labelledby="workbench-todos-title">
    <h2 id="workbench-todos-title">我的待办</h2>
    <div class="workbench-todos__empty">
      <p>暂未接入业务待办</p>
      <span>后续将在这里展示分派给你的待处理事项</span>
    </div>
  </section>
</template>

<style lang="postcss" scoped>
.workbench-todos {
  @apply flex flex-col min-w-0;
  padding: var(--in-space-5);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card-lg);
  background: var(--in-bg-color-surface);
}
.workbench-todos h2 {
  margin: 0;
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  line-height: var(--in-line-height-section-title);
  font-weight: var(--in-font-weight-section-title);
}
.workbench-todos__empty {
  @apply flex flex-col justify-center;
  flex: 1;
  min-height: 112px;
  gap: var(--in-space-2);
  padding-top: var(--in-space-4);
}
.workbench-todos__empty p {
  margin: 0;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-body);
  line-height: var(--in-line-height-body);
}
.workbench-todos__empty span {
  color: var(--in-text-color-placeholder);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-caption);
}
</style>
