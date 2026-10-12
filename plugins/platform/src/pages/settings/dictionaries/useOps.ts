import { useCapabilities } from "@ingot/admin-core";
import {
  createIamListLoader,
  IamAction,
  toIamSelectRecords,
  usePlatformTenantOptions,
} from "@ingot/admin-common";
import { PlatformApplicationPageAPI } from "@/api/iam/catalog";

/** 字典的作用域选择使用 IAM 目录，各自检查读取权限。 */
export function useDictionaryOptions() {
  const { hasAction } = useCapabilities();
  const loadAppOptions = createIamListLoader(async (page, condition) => {
    if (!hasAction(IamAction.PLATFORM_APPLICATION_READ)) throw new Error("需要应用目录读取权限");
    const response = await PlatformApplicationPageAPI(page, condition);
    return { data: toIamSelectRecords(response.data) };
  });
  const loadTenantOptions = usePlatformTenantOptions();
  return { loadAppOptions, loadTenantOptions };
}
