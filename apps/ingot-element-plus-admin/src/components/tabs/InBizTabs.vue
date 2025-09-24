<template>
  <div>
    <in-biz-tabs-header v-model="headerValue" :tabs="tabs" />
    <div class="inner-container">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { TabItem } from "./types";
import { tabsRootContextKey } from "./constants";
import { useOrderedChildren } from "element-plus";

const model = defineModel<string>({ required: true });
const emits = defineEmits(["change"]);

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
} = useOrderedChildren<any>(getCurrentInstance()!, "InBizTabPanel");

provide(tabsRootContextKey, {
  currentName: model,
  registerPane,
  unregisterPane,
});

watch(panes, (value) => {
  tabs.value = value.map((item) => {
    return {
      id: item.paneName,
      title: item.paneTitle,
    };
  });
});
</script>
<style lang="postcss" scoped>
.inner-container {
  border-top: 1px solid var(--in-border-color);
}
</style>
