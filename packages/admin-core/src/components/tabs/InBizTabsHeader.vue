<template>
  <div
    ref="rootRef"
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
      @click="privateOnItemClick(tab.id)"
    >
      <span class="inner">
        {{ tab.title }}
      </span>
    </button>
    <div class="in-biz-tabs-ink" :style="inkStyle" />
  </div>
</template>
<script lang="ts" setup>
import type { InBizTabsBeforeChange, TabItem } from "./types";

defineOptions({
  name: "InBizTabsHeader",
});

const model = defineModel<string>({ required: true });
const emits = defineEmits<{
  change: [value: string];
}>();
const props = defineProps<{
  tabs?: Array<TabItem>;
  beforeChange?: InBizTabsBeforeChange;
}>();

const rootRef = ref<HTMLElement>();
const tabRefs = ref<Array<HTMLButtonElement | undefined>>([]);
const inkStyle = ref<Record<string, string>>({
  width: "0px",
  left: "0px",
});

const setTabRef = (index: number, el: unknown) => {
  tabRefs.value[index] = el instanceof HTMLButtonElement ? el : undefined;
};

const privateUpdateInk = (): void => {
  const items = props.tabs ?? [];
  const currentIndex = items.findIndex((item) => item.id === model.value);
  const activeEl = tabRefs.value[currentIndex];
  const root = rootRef.value;
  const label = activeEl?.querySelector(".inner");
  if (!activeEl || !root || !(label instanceof HTMLElement)) {
    inkStyle.value = { width: "0px", left: "0px" };
    return;
  }
  const rootRect = root.getBoundingClientRect();
  const labelRect = label.getBoundingClientRect();
  inkStyle.value = {
    width: `${labelRect.width}px`,
    left: `${labelRect.left - rootRect.left}px`,
  };
};

const privateOnItemClick = async (id: string): Promise<void> => {
  if (model.value === id) {
    return;
  }
  if (props.beforeChange) {
    const allowed = await props.beforeChange(id);
    if (!allowed) {
      return;
    }
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
  void privateOnItemClick(next.id).then(() => {
    tabRefs.value[nextIndex]?.focus();
  });
};

onMounted(() => {
  nextTick(privateUpdateInk);
  const root = rootRef.value;
  if (!root || typeof ResizeObserver === "undefined") {
    return;
  }
  const observer = new ResizeObserver(() => {
    privateUpdateInk();
  });
  observer.observe(root);
  onUnmounted(() => {
    observer.disconnect();
  });
});

watch(
  () => [model.value, props.tabs],
  () => {
    nextTick(privateUpdateInk);
  },
);
</script>
<style scoped lang="postcss">
.in-biz-tabs-header {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
  padding: 0 var(--in-space-5);
  border-bottom: 1px solid var(--in-border-color);

  & .tab {
    cursor: pointer;
    text-align: center;
    background: transparent;
    border: 0;
    padding: 12px 16px 10px;
    margin: 0;
    color: var(--in-biz-tabs-color);
    font-size: var(--in-biz-tabs-font-size);
    line-height: var(--in-line-height-section-title);
    font-weight: var(--in-font-weight-body);

    & .inner {
      display: inline-block;
    }

    &:hover {
      color: var(--in-biz-tabs-color-active);
    }
  }

  & .tab-active {
    color: var(--in-biz-tabs-color-active);
  }

  & .in-biz-tabs-ink {
    box-sizing: border-box;
    height: calc(var(--in-biz-tabs-ink-height) * 2);
    border-radius: var(--in-biz-tabs-ink-height);
    left: 0;
    overflow: hidden;
    position: absolute;
    bottom: calc(var(--in-biz-tabs-ink-height) * -1);
    visibility: visible;
    z-index: 1;
    background: var(--in-biz-tabs-color-active);
    transition:
      width var(--in-biz-tabs-ink-duration) var(--in-biz-tabs-ink-ease),
      left var(--in-biz-tabs-ink-duration) var(--in-biz-tabs-ink-ease),
      top var(--in-biz-tabs-ink-duration) var(--in-biz-tabs-ink-ease);
  }
}
</style>
