<template>
  <div
    v-if="shouldBeRender"
    v-show="active"
    :id="`in-biz-panel-${props.name}`"
    class="in-biz-tab-panel"
    :class="{ 'is-fill': fill }"
  >
    <slot />
  </div>
</template>
<script setup lang="ts">
import type { InBizTabPanelContext } from "./constants";
import { detailDrawerTabsKey, tabsRootContextKey } from "./constants";
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
    default: true,
  },
  editable: {
    type: Boolean,
    default: true,
  },
  fill: {
    type: Boolean,
    default: false,
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

const pane: InBizTabPanelContext = {
  uid: instance.uid,
  paneName,
  paneTitle,
  getVnode: () => instance.vnode,
};

const drawerTabs = inject(detailDrawerTabsKey, null);
const paneEditable = computed(() => props.editable !== false);

onMounted(() => {
  tabsRoot.registerPane(pane);
  drawerTabs?.registerEditable(props.name, paneEditable);
});

onUnmounted(() => {
  tabsRoot.unregisterPane(pane.uid);
  drawerTabs?.unregisterEditable(props.name);
});
</script>
<style lang="postcss" scoped>
.in-biz-tab-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  overflow: auto;
}

.in-biz-tab-panel.is-fill {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.in-biz-tab-panel.is-fill > :deep(*) {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
