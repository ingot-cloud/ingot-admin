import { request, type RequestOptions } from "@ingot/admin-core";
import type { RoleTreeNodeVO, R } from "@/models";

const PATH = "/api/pms/v1/platform/admin/role";

export function RoleTreeAPI(
  orgId: string,
  options?: RequestOptions,
): Promise<R<Array<RoleTreeNodeVO>>> {
  return request.get<Array<RoleTreeNodeVO>>(`${PATH}/tree/${orgId}`, undefined, options);
}
