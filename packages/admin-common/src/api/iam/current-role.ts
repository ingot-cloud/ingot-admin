import { request, type R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  type CurrentRoleApis,
  type CreatedResource,
  type CurrentRoleGrantList,
  type CurrentRoleSummary,
  type ResourceDetail,
  type Preview,
  type CurrentRolePreviewResult,
  type CurrentRolePermissionResult,
} from "../../models/iam";
/** 共享和私有当前角色均按稳定角色ID管理，平台固定版本接口保留。 */
export const createCurrentRoleApis = (domain: "tenant" | "shared"): CurrentRoleApis => {
  const path = `${IAM_API_PREFIX}/v1/${domain === "tenant" ? "tenant/roles" : "platform/shared-roles"}`;
  return {
    createAPI: (input): Promise<R<CreatedResource>> => request.post(path, input),
    createPreviewAPI: (input): Promise<R<Preview<CurrentRolePreviewResult>>> =>
      request.post(`${path}/preview`, input),
    detailAPI: (id): Promise<R<ResourceDetail<CurrentRoleSummary>>> => request.get(`${path}/${id}`),
    grantsAPI: (id): Promise<R<CurrentRoleGrantList>> => request.get(`${path}/${id}/grants`),
    previewAPI: (id, input): Promise<R<Preview<CurrentRolePreviewResult>>> =>
      request.post(`${path}/${id}/preview`, input),
    saveAPI: (id, input): Promise<R<CurrentRolePermissionResult>> =>
      request.put(`${path}/${id}/grants`, input),
    profileAPI: (id, input): Promise<R<ResourceDetail<CurrentRoleSummary>>> =>
      request.patch(`${path}/${id}`, input),
  };
};
