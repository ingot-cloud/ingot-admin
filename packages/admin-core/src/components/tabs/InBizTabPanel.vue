<template>
  <div v-if="shouldBeRender" v-show="active" :id="`in-biz-panel-${props.name}`">
    <slot />
  </div>
</template>
<script setup lang="ts">
import type { InBizTabPanelContext } from "./constants";
import { tabsRootContextKey } from "./constants";
const COMPONENT_NAME = "InBizTabPanel";
defineOptions({
  name: COMPONENT_NAME,
});

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  lazy: {
    type: Boolean,
    required: false,
  },
});

const instance = getCurrentInstance()!;

const tabsRoot = inject(tabsRootContextKey);
if (!tabsRoot) {
  throw new Error("usage: <in-biz-tabs><in-biz-tab-pane /></in-biz-tabs/>");
}

const active = eagerComputed(() => tabsRoot.currentName.value === props.name);
const loaded = ref(active.value);
const paneName = computed(() => props.name);
const paneTitle = computed(() => props.title);
const shouldBeRender = eagerComputed(() => !props.lazy || loaded.value || active.value);
watch(active, (val) => {
  if (val) loaded.value = true;
});

const pane = reactive<InBizTabPanelContext>({
  uid: instance.uid,
  paneName,
  paneTitle,
});

onMounted(() => {
  tabsRoot.registerPane(pane as any);
});

onUnmounted(() => {
  tabsRoot.unregisterPane(pane.uid);
});
</script>
