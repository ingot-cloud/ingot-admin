import type { TableHeaderRecord } from "@ingot/admin-core";
import {
  FieldVisibility,
  type FieldOperationRule,
  type FieldPolicyDraft,
  type Selection,
} from "@ingot/admin-common";
import { formatTargetScope } from "./scope";

export const TABLE_ID = "org-iam-field-policies";
export const SPLIT_KEY = "org-iam-field-policies";
export const READ_ACTION_SUFFIX = ":read";
export const UNSPECIFIED_VIEWER = "未指定";
export const NO_OPERATION = "未开放";
export const OPERATION_SCOPE = "—";
export const EDITABLE_LABEL = "可编辑";
export const FILTERABLE_LABEL = "可筛选";

export const RULE_KIND = {
  VISIBILITY: "visibility",
  OPERATION: "operation",
} as const;

export type RuleKind = (typeof RULE_KIND)[keyof typeof RULE_KIND];

export const RULE_KIND_LABEL: Record<RuleKind, string> = {
  [RULE_KIND.VISIBILITY]: "可见性",
  [RULE_KIND.OPERATION]: "操作",
};

export interface PolicyRuleRow {
  key: string;
  kind: RuleKind;
  index: number;
  kindLabel: string;
  field: string;
  effect: string;
  viewers: string;
  scope: string;
}

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "类型", prop: "kindLabel", width: "96" },
  { label: "字段", prop: "field", minWidth: "140" },
  { label: "规则", prop: "effect", minWidth: "160" },
  { label: "查看者", prop: "viewers", minWidth: "180" },
  { label: "目标范围", prop: "scope", minWidth: "180" },
  { label: "操作", prop: "actions", width: "140", fixed: "right" },
];

export const actionIsRead = (code: string): boolean => code.endsWith(READ_ACTION_SUFFIX);

export const viewerSummary = (selection: Selection): string => {
  const parts: string[] = [];
  if (selection.members.length > 0) {
    parts.push(`${selection.members.length} 名成员`);
  }
  if (selection.departments.length > 0) {
    parts.push(`${selection.departments.length} 个部门`);
  }
  return parts.join("、") || UNSPECIFIED_VIEWER;
};

const operationEffect = (rule: FieldOperationRule): string => {
  const parts: string[] = [];
  if (rule.operations.editable) {
    parts.push(EDITABLE_LABEL);
  }
  if (rule.operations.filterable) {
    parts.push(FILTERABLE_LABEL);
  }
  return parts.join("、") || NO_OPERATION;
};

export const toPolicyRows = (
  draft: FieldPolicyDraft,
  fieldLabel: (key: string) => string,
  visibilityLabel: (value: FieldVisibility) => string,
): PolicyRuleRow[] => {
  const visibility = draft.rules.map((rule, index) => ({
    key: `${RULE_KIND.VISIBILITY}-${index}`,
    kind: RULE_KIND.VISIBILITY,
    index,
    kindLabel: RULE_KIND_LABEL[RULE_KIND.VISIBILITY],
    field: fieldLabel(rule.fieldKey),
    effect: visibilityLabel(rule.visibility),
    viewers: viewerSummary(rule.viewerSelection),
    scope: formatTargetScope(rule),
  }));
  const operations = draft.operationRules.map((rule, index) => ({
    key: `${RULE_KIND.OPERATION}-${index}`,
    kind: RULE_KIND.OPERATION,
    index,
    kindLabel: RULE_KIND_LABEL[RULE_KIND.OPERATION],
    field: fieldLabel(rule.fieldKey),
    effect: operationEffect(rule),
    viewers: viewerSummary(rule.viewerSelection),
    scope: OPERATION_SCOPE,
  }));
  return [...visibility, ...operations];
};
