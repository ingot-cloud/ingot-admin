import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  createResourceQueryKeys,
  queryAdminData,
  silentQueryRequest,
  snapshotQueryParams,
  type LoadDataParams,
  type ServerPagingQueryInput,
} from "@ingot/admin-core";
import type {
  Page,
  PlatformApp,
  PlatformAppDetailVO,
  PlatformAppFilterDTO,
  MenuTreeNode,
  AppPermissionTreeNodeVO,
} from "@/models";
import {
  AppDetailAPI,
  AppMenuTreeAPI,
  AppPageAPI,
  AppPermissionTreeAPI,
} from "./app";

const resourceKeys = createResourceQueryKeys("platform", "app");

export const appQueryKeys = {
  ...resourceKeys,
  menus: (appId: string) => [...resourceKeys.detail(appId), "menus"] as const,
  permissions: (appId: string) => [...resourceKeys.detail(appId), "permissions"] as const,
};

export function AppPageQueryOptions(
  input: MaybeRefOrGetter<ServerPagingQueryInput<PlatformAppFilterDTO>>,
) {
  const value = toValue(input);
  return queryOptions({
    queryKey: appQueryKeys.list(
      snapshotQueryParams({
        current: value.current,
        size: value.size,
        condition: value.condition,
      }),
    ),
    queryFn: ({ signal }): Promise<Page<PlatformApp>> =>
      AppPageAPI(
        { current: value.current, size: value.size },
        { ...value.condition },
        silentQueryRequest(signal),
      ).then(({ data }) => data),
  });
}

export function AppDetailQueryOptions(appId: MaybeRefOrGetter<string>) {
  const id = toValue(appId);
  return queryOptions({
    queryKey: appQueryKeys.detail(id),
    enabled: Boolean(id),
    queryFn: ({ signal }): Promise<PlatformAppDetailVO> =>
      AppDetailAPI(id, silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export function AppMenuTreeQueryOptions(appId: MaybeRefOrGetter<string>) {
  const id = toValue(appId);
  return queryOptions({
    queryKey: appQueryKeys.menus(id),
    enabled: Boolean(id),
    queryFn: ({ signal }): Promise<Array<MenuTreeNode>> =>
      AppMenuTreeAPI(id, silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export function AppPermissionTreeQueryOptions(appId: MaybeRefOrGetter<string>) {
  const id = toValue(appId);
  return queryOptions({
    queryKey: appQueryKeys.permissions(id),
    enabled: Boolean(id),
    queryFn: ({ signal }): Promise<Array<AppPermissionTreeNodeVO>> =>
      AppPermissionTreeAPI(id, silentQueryRequest(signal)).then(({ data }) => data),
  });
}

export const loadAppOptions = async (params: LoadDataParams): Promise<Page<PlatformApp>> => {
  return queryAdminData(
    AppPageQueryOptions({
      current: params.current,
      size: params.size,
      condition: {
        name: params.query,
      },
    }),
  );
};

