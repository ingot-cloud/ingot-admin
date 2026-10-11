import type { Page, R } from "@ingot/admin-core";
import type {
  AssignmentRecord,
  AuthorizationOption,
  AuthorizationCandidatesApi,
  CreatedResource,
  ResourceDetail,
  RoleDefinitionDraft,
  RolePublishInput,
  RoleRevision,
  ScopeBinding,
} from "./types";
import type { AssignmentUpgradeItem } from "./resourceExtension";

/** 显示名称不作为版本身份；系统序号始终保留。 */
export function roleVersionLabel(
  revision?: Pick<RoleRevision, "revision" | "versionName">,
): string {
  if (!revision) return "-";
  const sequence = `v${revision.revision}`;
  return revision.versionName?.trim() && revision.versionName !== sequence
    ? `${sequence} · ${revision.versionName}`
    : sequence;
}

/** 完整复制历史定义，编辑不会修改已发布快照或遗漏字段权限。 */
export function cloneRevisionDefinition(revision: RoleRevision): RoleDefinitionDraft {
  return JSON.parse(
    JSON.stringify({
      grants: revision.grants,
      deltas: revision.deltas,
      parameterDefinitions: revision.parameterDefinitions,
      metadataOverrides: revision.metadataOverrides,
      resourceFieldPermissions: revision.resourceFieldPermissions,
    }),
  );
}

export interface RoleRevisionMetadataInput {
  expectedMetadataVersion: string;
  versionName?: string;
  remark?: string;
}
export type RoleRevisionMetadataApi = (
  roleId: string,
  revisionId: string,
  input: RoleRevisionMetadataInput,
) => Promise<R<CreatedResource>>;
export type RoleApplicationSelection = "ALL" | "SOURCE_REVISIONS" | "ASSIGNMENTS";
export type RoleApplicationStatus =
  "PREPARING" | "READY" | "BLOCKED" | "RUNNING" | "PAUSED" | "SUCCEEDED";
export type RoleApplicationItemStatus =
  "PENDING" | "BLOCKED" | "SUCCEEDED" | "EXCLUDED" | "REVOKED" | "EXPIRED" | "ALREADY_TARGET";
export interface RoleApplicationTask {
  id: string;
  roleId: string;
  targetRevisionId: string;
  status: RoleApplicationStatus;
  version: string;
  targetRevisionNumber?: string;
  targetVersionName?: string;
  counts: Record<RoleApplicationItemStatus, number>;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}
export interface RoleApplicationItem {
  id: string;
  assignmentId: string;
  status: RoleApplicationItemStatus;
  original: AssignmentRecord;
  configuredBindings: Record<string, ScopeBinding>;
  preview?: AssignmentUpgradeItem;
  failureReason?: string;
}
export interface RoleApplicationPrepareInput {
  targetRevisionId: string;
  selection: RoleApplicationSelection;
  sourceRevisionIds?: string[];
  assignmentIds?: string[];
  idempotencyKey: string;
}
export interface RolePublishApplicationInput extends Omit<
  RoleApplicationPrepareInput,
  "targetRevisionId"
> {
  publish: RolePublishInput;
}
export interface RoleApplicationChangeInput {
  expectedVersion: string;
  all: boolean;
  itemIds?: string[];
  scopeBindings?: Record<string, ScopeBinding>;
  excluded?: boolean;
}
export interface RoleApplicationApi {
  prepare: (roleId: string, input: RoleApplicationPrepareInput) => Promise<R<RoleApplicationTask>>;
  publish: (roleId: string, input: RolePublishApplicationInput) => Promise<R<RoleApplicationTask>>;
  get: (roleId: string, id: string) => Promise<R<RoleApplicationTask>>;
  list: (roleId: string, page: Page) => Promise<R<Page<RoleApplicationTask>>>;
  items: (roleId: string, id: string, page: Page) => Promise<R<Page<RoleApplicationItem>>>;
  configure: (
    roleId: string,
    id: string,
    input: RoleApplicationChangeInput,
  ) => Promise<R<RoleApplicationTask>>;
  refresh: (
    roleId: string,
    id: string,
    input: { expectedVersion: string },
  ) => Promise<R<RoleApplicationTask>>;
  confirm: (
    roleId: string,
    id: string,
    input: { expectedVersion: string; idempotencyKey: string },
  ) => Promise<R<RoleApplicationTask>>;
  candidates: (roleId: string, page: Page) => Promise<R<Page<ResourceDetail<AssignmentRecord>>>>;
  distribution: (roleId: string) => Promise<R<RoleRevisionDistribution[]>>;
  target: (roleId: string, revisionId: string) => Promise<AuthorizationOption>;
  scopeCandidates: (assignmentId: string) => AuthorizationCandidatesApi;
}

export interface RoleRevisionDistribution {
  revisionId: string;
  revision: string;
  versionName?: string;
  count: number;
}

export function assignmentVersionLabel(record: {
  revisionNumber?: string | number;
  versionName?: string;
}): string {
  return roleVersionLabel({
    revision: String(record.revisionNumber ?? "-"),
    versionName: record.versionName,
  });
}
