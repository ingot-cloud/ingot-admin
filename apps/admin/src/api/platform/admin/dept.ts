import { Http as request } from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO } from "@base/models";

const PATH = "/api/pms/v1/platform/admin/dept";

export function DeptTreeAPI(orgId: string) {
  return request.get<Array<DeptTreeNodeWithManagerVO>>(`${PATH}/tree/${orgId}`);
}
