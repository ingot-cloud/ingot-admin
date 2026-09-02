import { request } from "@ingot/admin-core";
import type { RoleTreeNodeVO } from "@/models";

const PATH = "/api/pms/v1/platform/admin/role";

export function RoleTreeAPI(orgId: string) {
  return request.get<Array<RoleTreeNodeVO>>(`${PATH}/tree/${orgId}`);
}
