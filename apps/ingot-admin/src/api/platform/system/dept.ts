import request from "@/net";
import type { DeptTreeNodeWithManagerVO } from "@/models";

const PATH = "/api/pms/v1/platform/system/dept";

export function DeptTreeAPI(orgId: string) {
  return request.get<Array<DeptTreeNodeWithManagerVO>>(`${PATH}/tree/${orgId}`);
}
