import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  SelectionPurpose,
  type DepartmentRecord,
  type IamListQuery,
  type IamPageResponse,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";

const MEMBER_PATH = `${IAM_API_PREFIX}/v1/tenant/members`;
const DEPT_PATH = `${IAM_API_PREFIX}/v1/tenant/departments`;

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function SecurityMemberPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<MemberRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<MemberRecord>>>(
      MEMBER_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function SecurityDepartmentPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<DepartmentRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<DepartmentRecord>>>(
      DEPT_PATH,
      {
        ...toIamListParams(page, condition),
        purpose: SelectionPurpose.MANAGED_DEPARTMENT,
      },
      options,
    )
    .then(asPage);
}
