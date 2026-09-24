import {
  collectIamPageRecords,
  createIamListLoader,
  toIamSelectRecords,
  type IamSelectOption,
} from "@ingot/admin-common";
import { PlatformMemberPageAPI } from "@/api/iam/personnel";

export const loadPlatformMemberOptions = createIamListLoader(async (page, condition) => {
  const response = await PlatformMemberPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

export async function loadPlatformMembersByIds(ids: string[]): Promise<IamSelectOption[]> {
  if (!ids.length) {
    return [];
  }
  const collected = await collectIamPageRecords(async (page) => {
    const response = await PlatformMemberPageAPI(page, { ids: ids.join(",") });
    return { data: toIamSelectRecords(response.data) };
  });
  const byId = new Map(collected.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id) ?? { id, name: id });
}
