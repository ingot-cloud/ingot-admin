<template>
  <button
    type="button"
    class="in-app-bar-search-hit"
    :class="{ 'is-active': active }"
    role="option"
    :aria-selected="active"
    @click.stop="emit('select')"
  >
    <span class="in-app-bar-search-hit__icon" aria-hidden="true">
      <in-icon :name="icon || 'ep:menu'" />
    </span>
    <span class="in-app-bar-search-hit__text">
      <span class="in-app-bar-search-hit__title">
        <template v-for="(part, index) in titleParts" :key="`${part.text}-${index}`">
          <em v-if="part.match">{{ part.text }}</em>
          <template v-else>{{ part.text }}</template>
        </template>
      </span>
      <span v-if="description" class="in-app-bar-search-hit__desc">{{ description }}</span>
    </span>
  </button>
</template>
<script setup lang="ts">
import { splitHighlight } from "./splitHighlight";

defineOptions({
  name: "InAppBarSearchHit",
});

const props = defineProps<{
  title: string;
  description?: string;
  icon?: string;
  keyword?: string;
  active?: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();

const titleParts = computed(() => splitHighlight(props.title, props.keyword ?? ""));
</script>
<style lang="postcss" scoped>
.in-app-bar-search-hit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  gap: var(--in-space-3);
  width: 100%;
  min-width: 0;
  padding: var(--in-space-2) var(--in-space-6) var(--in-space-2) var(--in-space-2);
  border: 0;
  border-radius: var(--in-radius-card);
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover,
  &.is-active {
    background: var(--in-bg-color-control-hover);
  }
}

.in-app-bar-search-hit__icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-subtle);
  color: var(--in-text-color-secondary);
  font-size: 24px;
}

.in-app-bar-search-hit__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: calc(100% - 52px);
}

.in-app-bar-search-hit__title {
  display: flex;
  align-items: center;
  gap: var(--in-space-1);
  width: 100%;
  padding: 0;
  overflow: hidden;
  color: var(--in-text-color);
  font-size: var(--in-font-size-body);
  font-weight: var(--in-font-weight-section-title);
  line-height: var(--in-line-height-body);
  text-overflow: ellipsis;
  white-space: nowrap;

  & em {
    font-style: normal;
    font-weight: inherit;
    color: var(--in-color-primary);
  }
}

.in-app-bar-search-hit__desc {
  overflow: hidden;
  width: 100%;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  font-weight: var(--in-font-weight-body);
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
