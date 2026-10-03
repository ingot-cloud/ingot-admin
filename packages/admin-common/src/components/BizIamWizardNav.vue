<template>
  <aside
    class="iam-wizard-nav w-240px shrink-0 h-full px-24px py-24px b-r b-r-solid b-[var(--in-border-color)]"
  >
    <div v-for="(item, index) in steps" :key="item.title" class="flex gap-12px mb-24px last:mb-0">
      <div
        class="w-24px h-24px rounded-full flex items-center justify-center text-12px shrink-0 b b-solid bg-transparent"
        :class="privateStepTone(index)"
      >
        <svg
          v-if="index < current"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9.218 17.41 19.83 6.796a.99.99 0 1 1 1.389 1.415c-3.545 3.425-4.251 4.105-11.419 11.074a.997.997 0 0 1-1.375.017c-1.924-1.8-3.709-3.567-5.573-5.428a.999.999 0 0 1 1.414-1.415l4.95 4.95Z"
            fill="currentColor"
          />
        </svg>
        <span v-else>{{ index + 1 }}</span>
      </div>
      <div>
        <div
          :class="
            index === current ? 'text-[var(--el-color-primary)]' : 'text-[var(--in-text-color)]'
          "
        >
          {{ item.title }}
        </div>
        <div
          class="iam-wizard-nav__description text-12px text-[var(--el-text-color-secondary)] mt-4px"
        >
          {{ item.description }}
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineOptions({ name: "BizIamWizardNav" });
const props = defineProps<{
  steps: ReadonlyArray<{ title: string; description: string }>;
  current: number;
}>();
const privateStepTone = (index: number): string =>
  index <= props.current
    ? "b-[var(--el-color-primary)] text-[var(--el-color-primary)]"
    : "b-[var(--in-border-color)] text-[var(--el-text-color-secondary)]";
</script>

<style lang="postcss" scoped>
@media (max-width: 700px) {
  .iam-wizard-nav {
    width: 92px;
    padding: 16px 8px;
  }
  .iam-wizard-nav__description {
    display: none;
  }
}
</style>
