import { request, type Page, type R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  RoleKind,
  roleVersionLabel,
  toIamListParams,
  mapIamPage,
  type IamPageResponse,
  type ResourceDetail,
  type AssignmentRecord,
  type RoleApplicationApi,
  type RoleApplicationTask,
  type RoleApplicationItem,
  type RoleApplicationPrepareInput,
  type RolePublishApplicationInput,
  type RoleApplicationChangeInput,
} from "@ingot/admin-common";
import { PlatformRoleRevisionDetailAPI, PlatformRoleRevisionGrantsAPI } from "./authorization";
import { AssignmentUpgradeCandidatesAPI } from "./resourceExtension";
const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});
const path = (roleId: string) =>
  `${IAM_API_PREFIX}/v1/platform/roles/${roleId}/version-applications`;
export function PlatformRoleApplicationPrepareAPI(
  id: string,
  input: RoleApplicationPrepareInput,
): Promise<R<RoleApplicationTask>> {
  return request.post<RoleApplicationTask>(path(id), input);
}
export function PlatformRoleApplicationPublishAPI(
  id: string,
  input: RolePublishApplicationInput,
): Promise<R<RoleApplicationTask>> {
  return request.post<RoleApplicationTask>(`${path(id)}/publish`, input);
}
export function PlatformRoleApplicationGetAPI(
  id: string,
  taskId: string,
): Promise<R<RoleApplicationTask>> {
  return request.get<RoleApplicationTask>(`${path(id)}/${taskId}`);
}
export function PlatformRoleApplicationListAPI(
  id: string,
  page: Page,
): Promise<R<Page<RoleApplicationTask>>> {
  return request
    .get<IamPageResponse<RoleApplicationTask>>(path(id), toIamListParams(page))
    .then(asPage);
}
export function PlatformRoleApplicationItemsAPI(
  id: string,
  taskId: string,
  page: Page,
): Promise<R<Page<RoleApplicationItem>>> {
  return request
    .get<IamPageResponse<RoleApplicationItem>>(`${path(id)}/${taskId}/items`, toIamListParams(page))
    .then(asPage);
}
export function PlatformRoleApplicationConfigureAPI(
  id: string,
  taskId: string,
  input: RoleApplicationChangeInput,
): Promise<R<RoleApplicationTask>> {
  return request.patch<RoleApplicationTask>(`${path(id)}/${taskId}/items`, input);
}
export function PlatformRoleApplicationRefreshAPI(
  id: string,
  taskId: string,
  input: { expectedVersion: string },
): Promise<R<RoleApplicationTask>> {
  return request.post<RoleApplicationTask>(`${path(id)}/${taskId}/preflight`, input);
}
export function PlatformRoleApplicationConfirmAPI(
  id: string,
  taskId: string,
  input: { expectedVersion: string; idempotencyKey: string },
): Promise<R<RoleApplicationTask>> {
  return request.post<RoleApplicationTask>(`${path(id)}/${taskId}/confirm`, input);
}
export function PlatformRoleApplicationCandidatesAPI(
  id: string,
  page: Page,
): Promise<R<Page<ResourceDetail<AssignmentRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<AssignmentRecord>>>(
      `${path(id)}/candidates`,
      toIamListParams(page),
    )
    .then(asPage);
}
export const platformRoleApplicationApi: RoleApplicationApi = {
  prepare: PlatformRoleApplicationPrepareAPI,
  publish: PlatformRoleApplicationPublishAPI,
  get: PlatformRoleApplicationGetAPI,
  list: PlatformRoleApplicationListAPI,
  items: PlatformRoleApplicationItemsAPI,
  configure: PlatformRoleApplicationConfigureAPI,
  refresh: PlatformRoleApplicationRefreshAPI,
  confirm: PlatformRoleApplicationConfirmAPI,
  candidates: PlatformRoleApplicationCandidatesAPI,
  scopeCandidates: (id) => (query) => AssignmentUpgradeCandidatesAPI(id, query),
  distribution: (id) =>
    request.get<import("@ingot/admin-common").RoleRevisionDistribution[]>(
      `${path(id)}/distribution`,
    ),
  async target(id, revisionId) {
    const [revision, grants] = await Promise.all([
      PlatformRoleRevisionDetailAPI(id, revisionId),
      PlatformRoleRevisionGrantsAPI(id, revisionId),
    ]);
    return {
      id: revisionId,
      name: roleVersionLabel(revision.data.record),
      roleRevisionRef: { id: revisionId, kind: RoleKind.PLATFORM_CUSTOM },
      parameterDefinitions: revision.data.record.parameterDefinitions,
      resourceFieldPermissions: revision.data.record.resourceFieldPermissions,
      grants: grants.data.items.map((g) => ({ actionId: g.actionId, scopes: g.scopes })),
      actions: grants.data.items.map((g) => ({
        id: g.actionId,
        code: g.actionCode || "",
        scopeCapabilities: g.scopeCapabilities || [],
        name: g.actionName || g.actionCode || g.actionId,
        applicationId: g.applicationId || "",
        applicationName: g.applicationName || "",
        resourceId: g.resourceId || "",
        resourceName: g.resourceName || "",
      })),
    };
  },
};
