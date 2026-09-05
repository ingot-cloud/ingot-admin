<template>
  <el-menu-item
    v-if="isSingle"
    :index="singleRoute.path"
    class="in-menu-node"
    :class="{ 'has-icon': Boolean(itemIcon) }"
    :style="depthStyle"
  >
    <el-icon v-if="itemIcon" class="in-menu-node__icon">
      <in-icon :name="itemIcon" />
    </el-icon>
    <template #title>
      <span v-if="showTitle && singleRoute.title">{{ singleRoute.title }}</span>
    </template>
  </el-menu-item>
  <el-sub-menu
    v-else
    :index="route.path"
    class="in-menu-node"
    :class="{ 'has-icon': Boolean(route.icon) }"
    :style="depthStyle"
  >
    <template #title>
      <el-icon v-if="route.icon" class="in-menu-node__icon">
        <in-icon :name="route.icon" />
      </el-icon>
      <span v-if="showTitle && route.title">{{ route.title }}</span>
    </template>
    <in-submenu
      v-for="child in route.children"
      :key="child.path"
      :route="child"
      :level="level + 1"
    />
  </el-sub-menu>
</template>

<script lang="ts" setup>
import type { MenuRouteRecord } from "@/layouts";
import { useAppStateStore } from "@/stores/modules/app";
import { shellLayoutKey } from "@/layouts/main/types";

defineOptions({
  name: "InSubmenu",
});

const props = withDefaults(
  defineProps<{
    route: MenuRouteRecord;
    level?: number;
  }>(),
  {
    level: 0,
  },
);

const { getMenuOpened } = storeToRefs(useAppStateStore());
const shell = inject(shellLayoutKey);
const showTitle = computed(() => shell?.isOverlay.value || Boolean(getMenuOpened.value));
const depthStyle = computed(() => ({
  "--in-menu-depth": String(props.level),
}));

const isSingle = computed(() => {
  const children = props.route.children;
  return !children || children.length === 0 || children.length === 1;
});

const singleRoute = computed(() => {
  const children = props.route.children;
  if (children && children.length !== 0) {
    const child = children[0];
    return {
      ...child,
      title: props.route.title || child.title,
      icon: props.route.icon || child.icon,
    };
  }
  return props.route;
});

const itemIcon = computed(() => (isSingle.value ? singleRoute.value.icon : props.route.icon));
</script>
