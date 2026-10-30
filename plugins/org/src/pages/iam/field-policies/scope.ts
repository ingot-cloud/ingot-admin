import {
  ScopeBindingKind,
  ScopeKind,
  type FieldRule,
  type ScopeBinding,
  type ScopeExpression,
} from "@ingot/admin-common";

export const TARGET_ALL_LABEL = "全部对象";
export const TARGET_SELF_LABEL = "本人";
export const TARGET_MEMBER_DEPARTMENTS_LABEL = "所在部门";
export const TARGET_MANAGED_DEPARTMENTS_LABEL = "管理部门";
export const TARGET_MEMBERS_LABEL = "指定成员";
export const TARGET_DEPARTMENT_COUNT = "个部门";
export const TARGET_MEMBER_COUNT = "名成员";
export const TARGET_DESCENDANTS = "含下级";

const PARAMETER_PREFIX = "field-policy-";
const DEPARTMENT_PARAMETER = "departments";
const OBJECT_PARAMETER = "objects";

export const TARGET_SCOPE_OPTIONS = [
  { value: ScopeKind.ALL, label: TARGET_ALL_LABEL },
  { value: ScopeKind.SELF, label: TARGET_SELF_LABEL },
  { value: ScopeKind.MEMBER_DEPARTMENTS, label: TARGET_MEMBER_DEPARTMENTS_LABEL },
  { value: ScopeKind.MANAGED_DEPARTMENTS, label: TARGET_MANAGED_DEPARTMENTS_LABEL },
  { value: ScopeKind.OBJECT_SET, label: TARGET_MEMBERS_LABEL },
] as const;

export interface PolicyTargetValue {
  kind: ScopeKind;
  includeDescendants: boolean;
  departmentIds: string[];
  memberIds: string[];
  parameterKey: string;
}

export const emptyTarget = (): PolicyTargetValue => ({
  kind: ScopeKind.ALL,
  includeDescendants: false,
  departmentIds: [],
  memberIds: [],
  parameterKey: "",
});

const parameterKeyFor = (resourceId: string, kind: ScopeKind): string => {
  const suffix = kind === ScopeKind.MANAGED_DEPARTMENTS ? DEPARTMENT_PARAMETER : OBJECT_PARAMETER;
  return `${PARAMETER_PREFIX}${resourceId}-${suffix}`;
};

const optionLabel = (kind: ScopeKind): string =>
  TARGET_SCOPE_OPTIONS.find((item) => item.value === kind)?.label ?? kind;

const bindingIds = (rule: FieldRule, scope: ScopeExpression): string[] => {
  if (!scope.parameterKey) {
    return [];
  }
  return rule.scopeBindings[scope.parameterKey]?.ids ?? [];
};

const formatOne = (rule: FieldRule, scope: ScopeExpression): string => {
  if (scope.kind === ScopeKind.ALL) {
    return TARGET_ALL_LABEL;
  }
  const label = optionLabel(scope.kind);
  if (scope.kind === ScopeKind.MEMBER_DEPARTMENTS) {
    return scope.includeDescendants ? `${label}（${TARGET_DESCENDANTS}）` : label;
  }
  if (scope.kind === ScopeKind.MANAGED_DEPARTMENTS) {
    const count = bindingIds(rule, scope).length;
    const descendants = scope.includeDescendants ? `，${TARGET_DESCENDANTS}` : "";
    return count > 0 ? `${label}（${count} ${TARGET_DEPARTMENT_COUNT}${descendants}）` : label;
  }
  if (scope.kind === ScopeKind.OBJECT_SET) {
    const count = bindingIds(rule, scope).length;
    return count > 0 ? `${label}（${count} ${TARGET_MEMBER_COUNT}）` : label;
  }
  return label;
};

export const formatTargetScope = (rule: FieldRule): string => {
  if (rule.targetScope.length === 0) {
    return TARGET_ALL_LABEL;
  }
  return rule.targetScope.map((scope) => formatOne(rule, scope)).join("、");
};

export const parseTarget = (rule?: FieldRule): PolicyTargetValue => {
  const scope = rule?.targetScope[0];
  if (!rule || !scope || scope.kind === ScopeKind.ALL) {
    return emptyTarget();
  }
  const ids = bindingIds(rule, scope);
  return {
    kind: scope.kind,
    includeDescendants: scope.includeDescendants === true,
    departmentIds: scope.kind === ScopeKind.MANAGED_DEPARTMENTS ? [...ids] : [],
    memberIds: scope.kind === ScopeKind.OBJECT_SET ? [...ids] : [],
    parameterKey: scope.parameterKey ?? "",
  };
};

export const buildTarget = (
  value: PolicyTargetValue,
  resourceId: string,
): { targetScope: ScopeExpression[]; scopeBindings: Record<string, ScopeBinding> } => {
  if (value.kind === ScopeKind.ALL || value.kind === ScopeKind.SELF) {
    return { targetScope: [{ kind: value.kind }], scopeBindings: {} };
  }
  if (value.kind === ScopeKind.MEMBER_DEPARTMENTS) {
    return {
      targetScope: [{ kind: value.kind, includeDescendants: value.includeDescendants }],
      scopeBindings: {},
    };
  }
  const key = value.parameterKey || parameterKeyFor(resourceId, value.kind);
  if (value.kind === ScopeKind.MANAGED_DEPARTMENTS) {
    return {
      targetScope: [
        { kind: value.kind, parameterKey: key, includeDescendants: value.includeDescendants },
      ],
      scopeBindings: {
        [key]: { kind: ScopeBindingKind.DEPARTMENTS, ids: [...value.departmentIds] },
      },
    };
  }
  return {
    targetScope: [{ kind: ScopeKind.OBJECT_SET, parameterKey: key }],
    scopeBindings: {
      [key]: { kind: ScopeBindingKind.OBJECTS, ids: [...value.memberIds] },
    },
  };
};
