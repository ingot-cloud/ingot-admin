import type { LoadDataParams, Page } from "@ingot/admin-core";
import {
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  collectIamPageRecords,
  createIamListLoader,
  toIamSelectRecords,
  type ActionGrant,
  type AuthorizationDomain,
  type IamActionRef,
  type IamSelectOption,
} from "@ingot/admin-common";
import { PlatformActionPageAPI, PlatformApplicationPageAPI, PlatformResourcePageAPI } from "@/api/iam/catalog";
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

/**
 * 按应用分页反查操作 ID。操作列表必须带应用，没有跨应用查询接口。
 */
export async function resolveGrantActions(
  ids: string[],
  domain: AuthorizationDomain,
): Promise<IamActionRef[]> {
  const pending = new Set(ids.filter(Boolean));
  const found: IamActionRef[] = [];
  let current = 1;
  while (pending.size > 0) {
    const response = await PlatformApplicationPageAPI(
      {
        current,
        size: IAM_DEFAULT_PAGE_SIZE,
      },
      { domain },
    );
    const applications = response.data.records ?? [];
    if (!applications.length) {
      break;
    }
    const idList = [...pending].join(",");
    const matches = await Promise.all(
      applications.map(async (application) => {
        const actions = await PlatformActionPageAPI(
          application.record.id,
          { current: 1, size: IAM_DEFAULT_PAGE_SIZE },
          { ids: idList },
        );
        return (actions.data.records ?? []).map((action) => ({
          id: action.record.id,
          name: action.record.name || action.record.code,
          applicationId: application.record.id,
          applicationName: application.record.name,
        }));
      }),
    );
    for (const item of matches.flat()) {
      if (pending.delete(item.id)) {
        found.push(item);
      }
    }
    const total = response.data.total ?? applications.length;
    if (current * IAM_DEFAULT_PAGE_SIZE >= total) {
      break;
    }
    current += 1;
  }
  return found;
}

/** 把已发布授权还原成向导勾选模型，补齐应用、资源和范围能力。 */
export async function resolveSelectedGrants(
  grants: ActionGrant[],
  domain: AuthorizationDomain,
): Promise<SelectedGrant[]> {
  const pending = new Map(grants.filter((item) => item.actionId).map((item) => [item.actionId, item]));
  const found: SelectedGrant[] = [];
  let current = 1;
  while (pending.size > 0) {
    const response = await PlatformApplicationPageAPI(
      {
        current,
        size: IAM_DEFAULT_PAGE_SIZE,
      },
      { domain },
    );
    const applications = response.data.records ?? [];
    if (!applications.length) {
      break;
    }
    const idList = [...pending.keys()].join(",");
    const matches = await Promise.all(
      applications.map(async (application) => {
        const actions = await PlatformActionPageAPI(
          application.record.id,
          { current: 1, size: IAM_DEFAULT_PAGE_SIZE },
          { ids: idList },
        );
        const records = actions.data.records ?? [];
        if (!records.length) {
          return [];
        }
        const resources = await collectIamPageRecords((page) =>
          PlatformResourcePageAPI(application.record.id, page),
        );
        const resourceById = new Map(resources.map((item) => [item.record.id, item.record]));
        return records.flatMap((action) => {
          const grant = pending.get(action.record.id);
          if (!grant) {
            return [];
          }
          pending.delete(action.record.id);
          const resource = resourceById.get(action.record.resourceId);
          const capabilities = resource?.scopeCapabilities ?? [];
          return [
            {
              actionId: action.record.id,
              actionCode: action.record.code,
              actionName: action.record.name || action.record.code,
              resourceId: action.record.resourceId,
              resourceName: resource?.name ?? action.record.resourceId,
              applicationId: application.record.id,
              applicationName: application.record.name,
              scopes: grant.scopes.length ? grant.scopes.map((scope) => ({ ...scope })) : [defaultScope(capabilities)],
              scopeCapabilities: [...capabilities],
            } satisfies SelectedGrant,
          ];
        });
      }),
    );
    found.push(...matches.flat());
    const total = response.data.total ?? applications.length;
    if (current * IAM_DEFAULT_PAGE_SIZE >= total) {
      break;
    }
    current += 1;
  }
  return found;
}
