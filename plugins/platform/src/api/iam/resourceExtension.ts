import { request } from "@ingot/admin-core";
import type {
  AuthorizationCandidatePage,
  AuthorizationCandidateQuery,
  AuthorizationRoleCandidateQuery,
  AuthorizationRoleNode,
  IamPageResponse,
  Preview,
  AssignmentUpgradeInput,
  AssignmentUpgradeResult,
} from "@ingot/admin-common";
import { IAM_API_PREFIX } from "@ingot/admin-common";
const upgradePath = `${IAM_API_PREFIX}/v1/platform/assignments/upgrade`;
export const AssignmentUpgradePreviewAPI = (input: AssignmentUpgradeInput) =>
  request.post<Preview<AssignmentUpgradeResult>>(`${upgradePath}/preview`, input);
export const AssignmentUpgradeAPI = (input: AssignmentUpgradeInput) =>
  request.post<AssignmentUpgradeResult>(upgradePath, input);
export const AssignmentUpgradeRoleCandidatesAPI = (
  assignmentId: string,
  query: AuthorizationRoleCandidateQuery,
) =>
  request.get<IamPageResponse<AuthorizationRoleNode>>(`${upgradePath}/role-candidates`, {
    ...query,
    assignmentId,
  });
export const AssignmentUpgradeCandidatesAPI = (
  assignmentId: string,
  query: AuthorizationCandidateQuery,
) =>
  request.get<AuthorizationCandidatePage>(`${upgradePath}/candidates`, { ...query, assignmentId });
