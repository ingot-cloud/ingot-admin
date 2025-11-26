import request from "@/net";
import type { DeptTreeNode } from "@/models";

const PATH = "/api/pms/v1/platform/system/dept";

export function DeptTreeAPI(orgId: string) {
  return request.get<Array<DeptTreeNode>>(`${PATH}/tree/${orgId}`);
}
