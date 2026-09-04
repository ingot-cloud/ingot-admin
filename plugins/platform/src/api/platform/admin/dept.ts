import { request, type RequestOptions } from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO, R } from "@/models";

const PATH = "/api/pms/v1/platform/admin/dept";

export function DeptTreeAPI(
  orgId: string,
  options?: RequestOptions,
): Promise<R<Array<DeptTreeNodeWithManagerVO>>> {
  return request.get<Array<DeptTreeNodeWithManagerVO>>(
    `${PATH}/tree/${orgId}`,
    undefined,
    options,
  );
}
