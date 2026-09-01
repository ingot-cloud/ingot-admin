<template>
  <el-menu-item v-if="isSingle" :index="singleRoute.path">
    <el-icon>
      <in-icon
        v-if="singleRoute.icon"
        :name="singleRoute.icon"
        class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
        :class="{ 'mr-2': getMenuOpened }"
      />
    </el-icon>
    <template #title>
      <span v-if="singleRoute.title">
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
          :class="{ 'mr-2': getMenuOpened }"
        />
      </el-icon>
      <span v-if="route.title">
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

const props = defineProps({
  route: {
    type: Object as PropType<MenuRouteRecord>,
    default: null,
  },
});

const { getMenuOpened } = storeToRefs(useAppStateStore());

const isSingle = computed(() => {
  const children = props.route.children;
  return !children || children.length === 0 || children.length === 1;
});

const singleRoute = computed(() => {
  // 如果只有一个child，那么标题使用父标题如果存在的话
  const children = props.route.children;
  if (children && children.length !== 0) {
    const route = children[0];
    route.title = props.route.title || route.title;
    route.icon = props.route.icon || route.icon;
    return route;
  }
  return props.route;
});
</script>
