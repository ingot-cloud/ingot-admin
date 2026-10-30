<template>
  <div class="resource-rail">
    <h2 class="resource-rail__title">资源</h2>
    <div class="resource-rail__list">
      <button
        v-for="item in resources"
        :key="item.resourceId"
        type="button"
        class="resource-rail__item"
        :class="{ 'is-current': item.resourceId === model }"
        :aria-current="item.resourceId === model ? 'true' : undefined"
        @click="emit('select', item.resourceId)"
      >
        {{ item.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldPolicyResource } from "@ingot/admin-common";

defineOptions({ name: "ResourceRail" });

defineProps<{
  resources: FieldPolicyResource[];
}>();

const model = defineModel<string>({ required: true });

const emit = defineEmits<{
  select: [resourceId: string];
}>();
</script>

<style scoped lang="postcss">
.resource-rail {
  --resource-rail-mark: 3px;
  --resource-rail-current-bg: rgb(240, 244, 255);
  display: flex;
  flex-direction: column;
  gap: var(--in-space-3);
  height: 100%;
  min-height: 0;
}

.resource-rail__title {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--in-space-2);
  margin: 0;
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  font-weight: var(--in-font-weight-section-title);
  line-height: var(--in-line-height-section-title);
}

.resource-rail__title::before {
  content: "";
  width: var(--resource-rail-mark);
  height: 16px;
  border-radius: 2px;
  background: var(--in-color-primary);
}

.resource-rail__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--in-space-1);
  min-height: 0;
  overflow: auto;
}

.resource-rail__item {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 var(--in-space-2) 0 calc(var(--resource-rail-mark) + var(--in-space-2));
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-body);
  line-height: var(--in-line-height-body);
  text-align: left;
  cursor: pointer;
}

.resource-rail__item:hover,
.resource-rail__item.is-current {
  background: var(--resource-rail-current-bg);
}

.resource-rail__item.is-current {
  color: var(--in-color-primary);
}
</style>
