import type { LoadDataParams, Page } from "@ingot/admin-core";
import {
  AuthorizationDomainExtArray,
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  createIamListLoader,
  toIamSelectRecords,
  type AuthorizationDomain,
  type IamActionRef,
  type IamSelectOption,
} from "@ingot/admin-common";
import { PlatformActionPageAPI, PlatformApplicationPageAPI } from "@/api/iam/catalog";

const domainText = (domain: AuthorizationDomain): string =>
  AuthorizationDomainExtArray.find((item) => item.value === domain)?.text ?? domain;

/** 共享角色授权：按名称分页启用中的应用，名称前标出平台或组织。 */
export const loadGrantApplications = createIamListLoader(async (page, condition) => {
  const response = await PlatformApplicationPageAPI(page, {
    name: condition.name,
    status: ConfigurationStatus.ENABLED,
  });
  return {
    data: toIamSelectRecords({
      ...response.data,
      records: (response.data.records ?? []).map((item) => ({
        ...item,
        record: {
          ...item.record,
          name: `${domainText(item.record.domain)} / ${item.record.name}`,
        },
      })),
    }),
  };
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
export async function resolveGrantActions(ids: string[]): Promise<IamActionRef[]> {
  const pending = new Set(ids.filter(Boolean));
  const found: IamActionRef[] = [];
  let current = 1;
  while (pending.size > 0) {
    const response = await PlatformApplicationPageAPI({
      current,
      size: IAM_DEFAULT_PAGE_SIZE,
    });
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
