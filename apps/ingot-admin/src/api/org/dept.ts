import Http from "@/net";
import type { DeptTreeNodeWithManagerVO, DeptWithManagerDTO, DeptTreeNode, R } from "@/models";

/**
 * 获取部门树结构
 */
export function DeptTreeAPI(): Promise<R<Array<DeptTreeNodeWithManagerVO>>> {
  return Http.get<Array<DeptTreeNodeWithManagerVO>>("/api/pms/v1/org/dept/tree");
}

export function DeptTree2API(): Promise<R<Array<DeptTreeNodeWithManagerVO>>> {
  return Http.get<Array<DeptTreeNodeWithManagerVO>>("/api/pms/v1/org/dept/tree2");
}

export function DeptSimpleTreeAPI(): Promise<R<Array<DeptTreeNode>>> {
  return Http.get<Array<DeptTreeNode>>("/api/pms/v1/org/dept/simpleTree");
}

/**
 * 创建部门
 */
export function CreateDeptAPI(params: DeptWithManagerDTO): Promise<R<void>> {
  return Http.post("/api/pms/v1/org/dept", params);
}

/**
 * 更新部门信息
 */
export function UpdateDeptAPI(params: DeptWithManagerDTO): Promise<R<void>> {
  return Http.put("/api/pms/v1/org/dept", params);
}

/**
 * 删除部门
 * @param id 部门id
 */
export function RemoveDeptAPI(id: string): Promise<R<void>> {
  return Http.delete(`/api/pms/v1/org/dept/${id}`);
}
