import type { R } from "@ingot/admin-core";
import type {
  ActionGrant,
  AuthorizationOption,
  Preview,
  RoleRevisionRef,
  ResourceFieldPermissions,
  ScopeBinding,
  SubjectRef,
} from "./types";
export interface AssignmentUpgradeInput {
  targetRevisionRef: RoleRevisionRef;
  items: Array<{
    id: string;
    expectedVersion: string;
    scopeBindings?: Record<string, ScopeBinding>;
  }>;
}
export interface AssignmentUpgradeItem {
  id: string;
  subject: SubjectRef;
  previousRevisionRef: RoleRevisionRef;
  scopeBindings: Record<string, ScopeBinding>;
  before: ActionGrant[];
  after: ActionGrant[];
  allowed: boolean;
  issues: Preview["errors"];
  beforeFieldPermissions?: ResourceFieldPermissions;
  afterFieldPermissions?: ResourceFieldPermissions;
}
export interface AssignmentUpgradeResult {
  targetRevisionRef: RoleRevisionRef;
  items: AssignmentUpgradeItem[];
}
export type AssignmentUpgradePreviewApi = (
  input: AssignmentUpgradeInput,
) => Promise<R<Preview<AssignmentUpgradeResult>>>;
export type AssignmentUpgradeApi = (
  input: AssignmentUpgradeInput,
) => Promise<R<AssignmentUpgradeResult>>;
export interface AssignmentUpgradeDraft {
  id: string;
  version: string;
  bindings: Record<string, ScopeBinding>;
  option: AuthorizationOption;
}
