<template>
  <el-menu-item v-if="isSingle" :index="singleRoute.path">
    <el-icon>
      <in-icon
        v-if="singleRoute.icon"
        :name="singleRoute.icon"
        class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
        :class="{ 'mr-2': showTitle }"
      />
    </el-icon>
    <template #title>
      <span v-if="showTitle && singleRoute.title">
        {{ singleRoute.title }}
      </span>
    </template>
  </el-menu-item>
  <el-sub-menu v-else :index="route.path">
    <template #title>
      <el-icon>
        <in-icon
          v-if="route.icon"
          :name="route.icon"
          class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          :class="{ 'mr-2': showTitle }"
        />
      </el-icon>
      <span v-if="showTitle && route.title">
        {{ route.title }}
      </span>
    </template>
    <in-submenu v-for="child in route.children" :key="child.path" :route="child" />
  </el-sub-menu>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";
import type { MenuRouteRecord } from "@/layouts";
import { useAppStateStore } from "@/stores/modules/app";
import { shellLayoutKey } from "@/layouts/main/types";

defineOptions({
  name: "InSubmenu",
});

const props = defineProps({
  route: {
    type: Object as PropType<MenuRouteRecord>,
    default: null,
  },
});

const { getMenuOpened } = storeToRefs(useAppStateStore());
const shell = inject(shellLayoutKey);
const showTitle = computed(() => shell?.isOverlay.value || Boolean(getMenuOpened.value));

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
</script>
