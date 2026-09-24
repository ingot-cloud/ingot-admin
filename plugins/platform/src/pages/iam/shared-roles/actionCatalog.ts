import type { LoadDataParams, Page } from "@ingot/admin-core";
import {
  ConfigurationStatus,
  createIamListLoader,
  toIamSelectRecords,
  type ActionGrant,
  type AuthorizationDomain,
  type IamActionRef,
  type IamSelectOption,
} from "@ingot/admin-common";
import {
  PlatformActionLookupAPI,
  PlatformActionPageAPI,
  PlatformApplicationPageAPI,
} from "@/api/iam/catalog";
import { defaultScope, type SelectedGrant } from "./wizard";

/** 按管理域分页启用中的应用，供角色向导选择。 */
export const loadGrantApplications = (domain: AuthorizationDomain) =>
  createIamListLoader(async (page, condition) => {
    const response = await PlatformApplicationPageAPI(page, {
      domain,
      name: condition.name,
      status: ConfigurationStatus.ENABLED,
    });
    return { data: toIamSelectRecords(response.data) };
  });

/** 选定应用后按名称分页该应用下的操作。 */
export const loadGrantActions = (
  applicationId: string,
  params: LoadDataParams,
): Promise<Page<IamSelectOption>> =>
  createIamListLoader(async (page, condition) => {
    const response = await PlatformActionPageAPI(applicationId, page, { name: condition.name });
    return {
      data: toIamSelectRecords({
        ...response.data,
        records: (response.data.records ?? []).map((item) => ({
          ...item,
          record: {
            ...item.record,
            name: item.record.name || item.record.code,
          },
        })),
      }),
    };
  })(params);

/** 按操作 ID 一次解析名称与所属应用。 */
export async function resolveGrantActions(ids: string[]): Promise<IamActionRef[]> {
  const wanted = ids.filter(Boolean);
  if (!wanted.length) {
    return [];
  }
  const response = await PlatformActionLookupAPI({ ids: wanted });
  return (response.data ?? []).map((item) => ({
    id: item.id,
    name: item.name || item.code,
    applicationId: item.applicationId,
    applicationName: item.applicationName,
  }));
}

/** 把已发布授权还原成向导勾选模型，补齐应用、资源和范围能力。 */
export async function resolveSelectedGrants(grants: ActionGrant[]): Promise<SelectedGrant[]> {
  const pending = new Map(grants.filter((item) => item.actionId).map((item) => [item.actionId, item]));
  if (!pending.size) {
    return [];
  }
  const response = await PlatformActionLookupAPI({ ids: [...pending.keys()] });
  return (response.data ?? []).flatMap((item) => {
    const grant = pending.get(item.id);
    if (!grant) {
      return [];
    }
    pending.delete(item.id);
    const capabilities = item.scopeCapabilities ?? [];
    return [
      {
        actionId: item.id,
        actionCode: item.code,
        actionName: item.name || item.code,
        resourceId: item.resourceId,
        resourceName: item.resourceName,
        applicationId: item.applicationId,
        applicationName: item.applicationName,
        scopes: grant.scopes.length ? grant.scopes.map((scope) => ({ ...scope })) : [defaultScope(capabilities)],
        scopeCapabilities: [...capabilities],
      } satisfies SelectedGrant,
    ];
  });
}
