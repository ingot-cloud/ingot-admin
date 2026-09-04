import { request, type RequestOptions } from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO, DeptWithManagerDTO, DeptTreeNode, R } from "@/models";

/**
 * 获取部门树结构
 */
export function DeptTreeAPI(options?: RequestOptions): Promise<R<Array<DeptTreeNodeWithManagerVO>>> {
  return request.get<Array<DeptTreeNodeWithManagerVO>>("/api/pms/v1/org/dept/tree", undefined, options);
}

export function DeptTree2API(options?: RequestOptions): Promise<R<Array<DeptTreeNodeWithManagerVO>>> {
  return request.get<Array<DeptTreeNodeWithManagerVO>>("/api/pms/v1/org/dept/tree2", undefined, options);
}

export function DeptSimpleTreeAPI(options?: RequestOptions): Promise<R<Array<DeptTreeNode>>> {
  return request.get<Array<DeptTreeNode>>("/api/pms/v1/org/dept/simpleTree", undefined, options);
}

export function CreateDeptAPI(params: DeptWithManagerDTO, options?: RequestOptions): Promise<R<void>> {
  return request.post<void>("/api/pms/v1/org/dept", params, options);
}

export function UpdateDeptAPI(params: DeptWithManagerDTO, options?: RequestOptions): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/org/dept", params, options);
}

export function RemoveDeptAPI(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/org/dept/${id}`, null, options);
}
