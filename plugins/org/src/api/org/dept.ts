import { request } from "@ingot/admin-core";
import type { DeptTreeNodeWithManagerVO, DeptWithManagerDTO, DeptTreeNode, R } from "@/models";

/**
 * 获取部门树结构
 */
export function DeptTreeAPI(): Promise<R<Array<DeptTreeNodeWithManagerVO>>> {
  return request.get<Array<DeptTreeNodeWithManagerVO>>("/api/pms/v1/org/dept/tree");
}

export function DeptTree2API(): Promise<R<Array<DeptTreeNodeWithManagerVO>>> {
  return request.get<Array<DeptTreeNodeWithManagerVO>>("/api/pms/v1/org/dept/tree2");
}

export function DeptSimpleTreeAPI(): Promise<R<Array<DeptTreeNode>>> {
  return request.get<Array<DeptTreeNode>>("/api/pms/v1/org/dept/simpleTree");
}

/**
 * 创建部门
 */
export function CreateDeptAPI(params: DeptWithManagerDTO): Promise<R<void>> {
  return request.post<void>("/api/pms/v1/org/dept", params);
}

/**
 * 更新部门信息
 */
export function UpdateDeptAPI(params: DeptWithManagerDTO): Promise<R<void>> {
  return request.put<void>("/api/pms/v1/org/dept", params);
}

/**
 * 删除部门
 * @param id 部门id
 */
export function RemoveDeptAPI(id: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/org/dept/${id}`);
}
