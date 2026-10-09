<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive
      :key="epoch"
      :include="cacheEnabled ? ROUTE_CACHE_WRAPPER_NAME : []"
      :max="ROUTE_CACHE_LIMIT"
    >
      <component
        v-if="Component"
        :is="shouldCacheRoute(recordAt(route)) ? CachedRoutePage : UncachedRoutePage"
        :key="routeCacheKey(recordAt(route), route)"
        :component="Component"
        :location="route"
      />
    </keep-alive>
  </router-view>
</template>
<script setup lang="ts">
import { computed, inject, unref, ref, watch } from "vue";
import { useRoute, viewDepthKey, type RouteLocationNormalizedLoaded } from "vue-router";
import { useRouterStore } from "@/stores/modules/router";
import { usePermissions } from "@/stores/modules/auth";
import {
  CachedRoutePage,
  UncachedRoutePage,
  ROUTE_CACHE_WRAPPER_NAME,
  ROUTE_CACHE_LIMIT,
  routeCacheKey,
  shouldCacheRoute,
} from "./routeCache";
const route = useRoute();
const cacheEnabled = ref(true);
const depth = inject(viewDepthKey, 0);
const recordAt = (route: RouteLocationNormalizedLoaded) =>
  route.matched.slice(unref(depth)).find((record) => record.components);
const store = useRouterStore(),
  permissions = usePermissions();
const epoch = computed(() => `${permissions.contextEpoch}:${permissions.version ?? ""}`);
// 配置变化清掉条目，活跃页保留到下一次导航，以免菜单保存销毁其详情抽屉。
watch(
  () => store.cacheEpoch,
  () => {
    cacheEnabled.value = false;
  },
  { flush: "sync" },
);
watch(
  () => route.fullPath,
  () => {
    cacheEnabled.value = true;
  },
  { flush: "sync" },
);
watch(
  epoch,
  () => {
    cacheEnabled.value = true;
  },
  { flush: "sync" },
);
</script>
