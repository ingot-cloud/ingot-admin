<template>
  <div class="in-biz-tabs">
    <in-biz-tabs-header v-model="headerValue" :tabs="tabs" :before-change="beforeChange" />
    <div
      class="inner-container"
      :class="{ 'is-aligned': alignContent }"
      :style="contentPaddingStyle"
    >
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { InBizTabsBeforeChange, TabItem } from "./types";
import type { InBizTabPanelContext } from "./constants";
import { tabsRootContextKey } from "./constants";
import { useOrderedChildren } from "@/hooks/components/useOrderedChildren";
import InBizTabsHeader from "./InBizTabsHeader.vue";

defineOptions({
  name: "InBizTabs",
});

const model = defineModel<string>({ required: true });
const emits = defineEmits<{
  change: [value: string];
}>();
const props = defineProps<{
  beforeChange?: InBizTabsBeforeChange;
  contentPadding?: string;
  alignContent?: boolean;
}>();

const contentPaddingStyle = computed(() =>
  props.contentPadding ? { padding: props.contentPadding } : undefined,
);

const tabs = ref<Array<TabItem>>([]);
const headerValue = computed<string>({
  set(v) {
    emits("change", v);
    model.value = v;
  },
  get() {
    return model.value;
  },
});

const {
  children: panes,
  addChild: registerPane,
  removeChild: unregisterPane,
} = useOrderedChildren<InBizTabPanelContext>(getCurrentInstance()!, "InBizTabPanel");

provide(tabsRootContextKey, {
  currentName: model,
  registerPane,
  unregisterPane,
});

watch(panes, (value) => {
  tabs.value = value.map((item) => {
    return {
      id: item.paneName.value,
      title: item.paneTitle.value,
    };
  });
});
</script>
<style lang="postcss" scoped>
.in-biz-tabs {
  --in-biz-tabs-inline-padding: var(--in-space-5);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  flex: 1;
  width: 100%;
}

.inner-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.inner-container.is-aligned {
  padding: var(--in-space-5) var(--in-biz-tabs-inline-padding);
}
</style>
