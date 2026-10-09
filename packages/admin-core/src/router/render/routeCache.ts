import {
  cloneVNode,
  computed,
  defineComponent,
  provide,
  reactive,
  watch,
  type PropType,
  type VNode,
} from "vue";
import {
  routeLocationKey,
  routerViewLocationKey,
  type RouteLocationNormalizedLoaded,
  type RouteRecordNormalized,
} from "vue-router";

export const ROUTE_CACHE_LIMIT = 20;
export const ROUTE_CACHE_WRAPPER_NAME = "InCachedRoutePage";

/** 包装器的名称及身份与业务组件名无关；冻结失活布局的路由上下文。 */
function routeWrapper(name: string) {
  return defineComponent({
    name,
    props: {
      component: { type: Object as PropType<VNode>, required: true },
      location: { type: Object as PropType<RouteLocationNormalizedLoaded>, required: true },
    },
    setup(props) {
      const location = reactive({ ...props.location });
      watch(
        () => props.location,
        (value) => Object.assign(location, value),
      );
      provide(routeLocationKey, location);
      provide(
        routerViewLocationKey,
        computed(() => props.location),
      );
      return () => cloneVNode(props.component);
    },
  });
}
export const CachedRoutePage = routeWrapper(ROUTE_CACHE_WRAPPER_NAME);
export const UncachedRoutePage = routeWrapper("InUncachedRoutePage");

export function routeCacheKey(
  record: RouteRecordNormalized | undefined,
  route: RouteLocationNormalizedLoaded,
): string {
  const names = [...(record?.path ?? "").matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g)].map(
    (match) => match[1],
  );
  return JSON.stringify([
    String(record?.name ?? record?.path ?? route.path),
    names.map((name) => route.params[name] ?? ""),
  ]);
}
export function shouldCacheRoute(record?: RouteRecordNormalized): boolean {
  // 缓存目录包装器以保留其子缓存容器；目录自身不提供页面缓存开关。
  return record?.meta.menuKind === "DIRECTORY" || record?.meta.isCache === true;
}
