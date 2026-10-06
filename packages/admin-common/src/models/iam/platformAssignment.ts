import { ScopeBindingKind, ScopeKind } from "./constants";
import type {
  AssignmentBatchInput,
  AuthorizationActionOption,
  AuthorizationOption,
  DelegationInput,
  ScopeBinding,
  SubjectRef,
} from "./types";
import { durationHours } from "./duration";

/** 每个固定版本保存独立参数；已选名称快照不依赖候选当前页。 */
export interface PlatformAssignmentRoleDraft {
  /** 编辑关联记录时独立标识，避免相同版本的多条分配参数合并。 */
  configurationKey?: string;
  option: AuthorizationOption;
  bindings: Record<string, ScopeBinding>;
  selectedObjects: Record<string, AuthorizationOption[]>;
}

export const assignmentRoleKey = (option: AuthorizationOption): string =>
  `${option.roleRevisionRef?.kind}:${option.id}`;

export const assignmentDraftKey = (role: PlatformAssignmentRoleDraft): string =>
  role.configurationKey || assignmentRoleKey(role.option);

/** 配置按固定版本及参数去重，与操作列表的分页和搜索无关。 */
export interface AssignmentScopeConfiguration {
  key: string;
  roleKey: string;
  parameterKey: string;
  role: PlatformAssignmentRoleDraft;
  actions: AuthorizationActionOption[];
  supported: boolean;
  configured: boolean;
  label: string;
}

export function assignmentScopeConfigurations(
  roles: PlatformAssignmentRoleDraft[],
): AssignmentScopeConfiguration[] {
  return roles.flatMap((role) => {
    const roleKey = assignmentDraftKey(role);
    return (role.option.parameterDefinitions || []).map((parameter) => {
      const grants = (role.option.grants || []).filter((grant) =>
        grant.scopes.some(
          (scope) => scope.kind === ScopeKind.OBJECT_SET && scope.parameterKey === parameter.key,
        ),
      );
      const actions = (role.option.actions || []).filter((action) =>
        grants.some((grant) => grant.actionId === action.id),
      );
      const supported =
        parameter.kind === ScopeBindingKind.OBJECTS &&
        grants.length > 0 &&
        actions.length === grants.length &&
        new Set(actions.map((action) => action.resourceId)).size === 1;
      const binding = role.bindings[parameter.key];
      const context = actions[0]
        ? `${actions[0].applicationName} / ${actions[0].resourceName}`
        : "范围资料不可用";
      return {
        key: JSON.stringify([roleKey, parameter.key]),
        roleKey,
        parameterKey: parameter.key,
        role,
        actions,
        supported,
        configured: supported && binding?.kind === parameter.kind && binding.ids.length > 0,
        label: `${role.option.name} / ${context}${actions.length ? ` · ${actions.map((action) => action.name).join("、")}` : ""}`,
      };
    });
  });
}

export function reconcileAssignmentRoles(
  previous: PlatformAssignmentRoleDraft[],
  options: AuthorizationOption[],
): PlatformAssignmentRoleDraft[] {
  return options.map((option) => {
    const existing = previous.find(
      (role) => assignmentRoleKey(role.option) === assignmentRoleKey(option),
    );
    return existing
      ? { ...existing, option }
      : {
          option,
          bindings: Object.fromEntries(
            (option.parameterDefinitions || []).map(({ key, kind }) => [key, { kind, ids: [] }]),
          ),
          selectedObjects: {},
        };
  });
}

/** 只验证角色已定义的范围，不在分配时发明额外范围或默认全部。 */
export function assignmentScopeIssues(
  roles: PlatformAssignmentRoleDraft[],
  requireObjects = true,
): string[] {
  return roles.flatMap(({ option, bindings }) => {
    const issues: string[] = [];
    if (
      !option.roleRevisionRef ||
      !option.parameterDefinitions ||
      !option.grants ||
      !option.actions
    ) {
      return [`${option.name}：固定版本资料不完整，请重新加载`];
    }
    const actions = new Map(option.actions.map((action) => [action.id, action]));
    if (Object.keys(bindings).length !== option.parameterDefinitions.length)
      issues.push(`${option.name}：范围参数与固定版本不一致`);
    if (option.grants.some((grant) => !actions.has(grant.actionId) || !grant.scopes.length))
      issues.push(`${option.name}：部分操作资料或范围不可用`);
    if (
      option.grants.some((grant) =>
        grant.scopes.some(
          (scope) =>
            scope.kind === ScopeKind.MEMBER_DEPARTMENTS ||
            scope.kind === ScopeKind.MANAGED_DEPARTMENTS,
        ),
      )
    )
      issues.push(`${option.name}：平台角色不支持部门范围`);
    for (const parameter of option.parameterDefinitions) {
      const associated = option.grants.filter((grant) =>
        grant.scopes.some(
          (scope) => scope.kind === ScopeKind.OBJECT_SET && scope.parameterKey === parameter.key,
        ),
      );
      const resources = new Set(associated.map((grant) => actions.get(grant.actionId)?.resourceId));
      if (
        parameter.kind !== ScopeBindingKind.OBJECTS ||
        !associated.length ||
        resources.size !== 1 ||
        resources.has(undefined)
      )
        issues.push(`${option.name}：对象参数与资源不兼容`);
      if (bindings[parameter.key]?.kind !== parameter.kind)
        issues.push(`${option.name}：范围参数类型不匹配`);
      if (requireObjects && !bindings[parameter.key]?.ids.length)
        issues.push(`${option.name}：请配置指定对象`);
    }
    if (
      option.grants.some((grant) =>
        grant.scopes.some(
          (scope) =>
            scope.kind === ScopeKind.OBJECT_SET &&
            !option.parameterDefinitions?.some((parameter) => parameter.key === scope.parameterKey),
        ),
      )
    )
      issues.push(`${option.name}：指定对象缺少参数定义`);
    return issues;
  });
}

export function assignmentValidityIssue(
  validFrom?: string,
  validUntil?: string,
  basis?: DelegationInput,
  now = Date.now(),
): string | undefined {
  const from = validFrom ? Date.parse(validFrom) : now;
  const until = validUntil ? Date.parse(validUntil) : undefined;
  if (!Number.isFinite(from) || (until !== undefined && (!Number.isFinite(until) || until <= from)))
    return "失效时间必须晚于生效时间";
  if (!basis) return;
  if (basis.validFrom && from < Date.parse(basis.validFrom)) return "生效时间不能早于来源委派";
  if (basis.validUntil && (until === undefined || until > Date.parse(basis.validUntil)))
    return "失效时间不能超出来源委派";
  if (basis.assignmentDurationMode !== "UNLIMITED" && basis.maxAssignmentDuration) {
    if (until === undefined) return "来源委派限制单次分配时长，请设置失效时间";
    if (until - from > durationHours(basis.maxAssignmentDuration) * 3600000)
      return "分配有效期超过委派允许的单次最长时间";
  }
}

/** 按接收对象×固定版本展开并复制参数，供原子提交及预览快照使用。 */
export function assignmentBatch(
  subjects: SubjectRef[],
  roles: PlatformAssignmentRoleDraft[],
  validFrom?: string,
  validUntil?: string,
  delegationGrantId?: string,
): AssignmentBatchInput {
  return {
    items: subjects.flatMap((subject) =>
      roles.flatMap(({ option, bindings }) =>
        option.roleRevisionRef
          ? [
              {
                subject: { ...subject },
                roleRevisionRef: { ...option.roleRevisionRef },
                scopeBindings: Object.fromEntries(
                  Object.entries(bindings).map(([key, binding]) => [
                    key,
                    { ...binding, ids: [...binding.ids] },
                  ]),
                ),
                validFrom,
                validUntil,
                delegationGrantId,
              },
            ]
          : [],
      ),
    ),
  };
}
