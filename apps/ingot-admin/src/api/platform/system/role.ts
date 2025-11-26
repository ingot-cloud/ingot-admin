import request from "@/net";
import type { RoleTreeNodeVO } from "@/models";

const PATH = "/api/pms/v1/platform/system/role";

export function RoleTreeAPI(orgId: string) {
  return request.get<Array<RoleTreeNodeVO>>(`${PATH}/tree/${orgId}`);
}
