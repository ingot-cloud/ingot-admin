<template>
  <div
    class="in-biz-tabs-header"
    role="tablist"
    @keydown="privateOnKeydown"
  >
    <button
      class="tab"
      type="button"
      v-for="(tab, index) in tabs"
      :key="tab.id"
      :class="{ 'tab-active': model === tab.id }"
      role="tab"
      :aria-selected="model === tab.id"
      :tabindex="model === tab.id ? 0 : -1"
      :ref="(el) => setTabRef(index, el)"
      @click="onItemClick(tab.id)"
    >
      <span class="inner">
        {{ tab.title }}
      </span>
    </button>
  </div>
</template>
<script lang="ts" setup>
import type { TabItem } from "./types";

defineOptions({
  name: "InBizTabsHeader",
});

const model = defineModel<string>({ required: true });
const emits = defineEmits<{
  change: [value: string];
}>();
const props = defineProps<{
  tabs?: Array<TabItem>;
}>();

const tabRefs = ref<Array<HTMLButtonElement | undefined>>([]);
const setTabRef = (index: number, el: unknown) => {
  tabRefs.value[index] = el instanceof HTMLButtonElement ? el : undefined;
};

const onItemClick = (id: string) => {
  if (model.value === id) {
    return;
  }
  model.value = id;
  emits("change", id);
};

const privateOnKeydown = (event: KeyboardEvent) => {
  const items = props.tabs ?? [];
  if (items.length === 0) {
    return;
  }
  const currentIndex = items.findIndex((item) => item.id === model.value);
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
    return;
  }
  event.preventDefault();
  const delta = event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = (currentIndex + delta + items.length) % items.length;
  const next = items[nextIndex];
  if (!next) {
    return;
  }
  onItemClick(next.id);
  tabRefs.value[nextIndex]?.focus();
};
</script>
<style scoped lang="postcss">
.in-biz-tabs-header {
  @apply flex flex-row;
  padding: 0 var(--in-space-3);

  & .tab {
    @apply cursor-pointer;
    text-align: center;
    line-height: 24px;
    padding: 4px 0;
    margin: 0 4px 0 0;
    color: var(--in-text-color-secondary);
    background: transparent;
    border: 0;

    & .inner {
      display: inline-block;
      padding: 8px 12px;
      border-radius: var(--in-radius-control);
      transition: background-color var(--in-motion-duration) var(--in-motion-ease);
      &:hover {
        background: var(--in-bg-color-hover);
      }
    }
  }

  & .tab-active {
    position: relative;

    & .inner {
      color: var(--in-text-color);
      font-weight: 500;
    }

    &:after {
      content: "";
      height: 2px;
      width: 20px;
      background: var(--in-text-color);
      margin: 0 auto;
      display: block;
      border-radius: 1px;
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translate(-50%);
    }
  }
}
</style>
