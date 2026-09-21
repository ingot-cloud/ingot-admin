<template>
  <div class="in-form-skeleton" role="status" aria-live="polite" aria-label="加载中">
    <div v-for="row in rows" :key="row" class="in-form-skeleton__item">
      <span class="in-form-skeleton__label" />
      <span class="in-form-skeleton__value" />
    </div>
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: "InFormSkeleton",
});

withDefaults(
  defineProps<{
    rows?: number;
  }>(),
  {
    rows: 4,
  },
);
</script>
<style lang="postcss" scoped>
.in-form-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-5);
  padding: var(--in-space-5);
  box-sizing: border-box;
  width: 100%;
}

.in-form-skeleton__item {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-2);
}

.in-form-skeleton__label,
.in-form-skeleton__value {
  display: block;
  border-radius: var(--in-radius-control);
  background: var(--in-bg-color-muted);
}

.in-form-skeleton__label {
  width: 64px;
  height: var(--in-line-height-body);
}

.in-form-skeleton__value {
  width: 100%;
  max-width: 280px;
  height: 32px;
}

.in-form-skeleton__item:nth-child(even) .in-form-skeleton__value {
  max-width: 200px;
}

@media (prefers-reduced-motion: no-preference) {
  .in-form-skeleton__label,
  .in-form-skeleton__value {
    background: linear-gradient(
      90deg,
      var(--in-bg-color-muted) 25%,
      var(--in-gray-200) 37%,
      var(--in-bg-color-muted) 63%
    );
    background-size: 400% 100%;
    animation: in-form-skeleton-shimmer 1.4s ease infinite;
  }
}

@keyframes in-form-skeleton-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
