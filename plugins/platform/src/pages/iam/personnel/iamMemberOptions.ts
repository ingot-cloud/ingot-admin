import {
  ConfigurationStatus,
  createIamListLoader,
  IAM_DEFAULT_PAGE_SIZE,
  toIamSelectRecords,
  type IamSelectOption,
} from "@ingot/admin-common";
import type { LoadDataParams, Page } from "@ingot/admin-core";
import { PlatformRolePageAPI } from "@/api/iam/authorization";
import { PlatformGroupMembersAPI, PlatformGroupPageAPI, PlatformMemberPageAPI } from "@/api/iam/personnel";

export const loadPlatformMemberOptions = createIamListLoader(async (page, condition) => {
  const response = await PlatformMemberPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

export const loadPlatformRoleOptions = createIamListLoader(async (page, condition) => {
  const response = await PlatformRolePageAPI(page, {
    ...condition,
    status: ConfigurationStatus.ENABLED,
  });
  return { data: toIamSelectRecords(response.data) };
});

export const loadPlatformGroupOptions = createIamListLoader(async (page, condition) => {
  const response = await PlatformGroupPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

export async function loadPlatformGroupBoundMembers(
  groupId: string,
  params: LoadDataParams,
): Promise<Page<IamSelectOption>> {
  const response = await PlatformGroupMembersAPI(
    { current: params.current, size: params.size ?? IAM_DEFAULT_PAGE_SIZE },
    { groupId, name: params.query },
  );
  return toIamSelectRecords(response.data);
}
