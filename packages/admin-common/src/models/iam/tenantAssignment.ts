import { ScopeBindingKind } from "./constants";
import { assignmentWindowIssue } from "./delegationPeriod";
import type {
  CurrentRoleGrantList,
  CurrentRoleParameter,
  TenantAssignmentInput,
  TenantDelegationMine,
} from "./tenantCurrentRoles";
import type { IamSelectOption } from "./helpers";
import type { ScopeBinding, SubjectRef } from "./types";

/** 租户分配中的一个当前角色；没有版本，参数定义来自 `roleAPI` 返回的当前定义。 */
export interface TenantAssignmentRoleDraft {
  role: IamSelectOption;
  /** 按当前授权依据加载的角色定义；未加载时不能配置范围或提交。 */
  definition?: CurrentRoleGrantList;
  bindings: Record<string, ScopeBinding>;
  /** 已选对象名称快照，仅用于回显和预览，不随提交发送。 */
  selectedObjects: Record<string, IamSelectOption[]>;
}

/** 一个「角色 × 范围参数」的配置项。 */
export interface TenantAssignmentScopeItem {
  key: string;
  roleId: string;
  parameter: CurrentRoleParameter;
  resourceName: string;
  label: string;
  configured: boolean;
}

export const tenantScopeKindLabel = (kind: ScopeBindingKind): string =>
  kind === ScopeBindingKind.DEPARTMENTS ? "管理部门" : "指定对象";

/** 按所选角色顺序重建草稿，已有角色保留定义、参数与名称快照。 */
export function reconcileTenantAssignmentRoles(
  previous: TenantAssignmentRoleDraft[],
  options: IamSelectOption[],
): TenantAssignmentRoleDraft[] {
  return options.map((option) => {
    const existing = previous.find((draft) => draft.role.id === option.id);
    return existing
      ? { ...existing, role: { id: option.id, name: option.name } }
      : { role: { id: option.id, name: option.name }, bindings: {}, selectedObjects: {} };
  });
}

/** 写入角色定义：参数按 key 与类型保留已填对象，定义外的参数丢弃。 */
export function applyTenantRoleDefinition(
  draft: TenantAssignmentRoleDraft,
  definition: CurrentRoleGrantList,
): TenantAssignmentRoleDraft {
  const parameters = definition.definition.parameterDefinitions;
  return {
    ...draft,
    definition,
    bindings: Object.fromEntries(
      parameters.map(({ key, kind }) => {
        const existing = draft.bindings[key];
        return [key, existing?.kind === kind ? existing : { kind, ids: [] }];
      }),
    ),
    selectedObjects: Object.fromEntries(
      parameters.flatMap(({ key }) =>
        draft.selectedObjects[key] ? [[key, draft.selectedObjects[key]]] : [],
      ),
    ),
  };
}

export function tenantAssignmentScopeItems(
  roles: TenantAssignmentRoleDraft[],
): TenantAssignmentScopeItem[] {
  return roles.flatMap((draft) =>
    (draft.definition?.definition.parameterDefinitions || []).map((parameter) => {
      const resourceName =
        draft.definition?.items.find((item) => item.resourceId === parameter.resourceId)
          ?.resourceName || "资源";
      const binding = draft.bindings[parameter.key];
      return {
        key: JSON.stringify([draft.role.id, parameter.key]),
        roleId: draft.role.id,
        parameter,
        resourceName,
        label: `${draft.role.name} / ${resourceName} · ${tenantScopeKindLabel(parameter.kind)}`,
        configured: binding?.kind === parameter.kind && binding.ids.length > 0,
      };
    }),
  );
}

/** 角色资料未加载或参数未填时给出提示；不发明额外范围，也不默认全部。 */
export function tenantAssignmentScopeIssues(roles: TenantAssignmentRoleDraft[]): string[] {
  return [
    ...roles
      .filter((draft) => !draft.definition)
      .map((draft) => `${draft.role.name}：角色资料未加载，请重新加载`),
    ...tenantAssignmentScopeItems(roles)
      .filter((item) => !item.configured)
      .map((item) => `${item.label}：请选择${tenantScopeKindLabel(item.parameter.kind)}`),
  ];
}

/** 租户委派总是限制单次时长，直接分配不受来源约束。 */
export const tenantAssignmentValidityIssue = (
  validFrom?: string,
  validUntil?: string,
  source?: TenantDelegationMine,
  now = Date.now(),
): string | undefined =>
  assignmentWindowIssue(
    validFrom,
    validUntil,
    source && {
      validFrom: source.validFrom,
      validUntil: source.validUntil,
      maxDuration: source.maxAssignmentDuration,
    },
    now,
  );

/** 按接收对象 × 角色展开并复制参数，供原子提交和预览快照使用。 */
export function tenantAssignmentBatch(
  subjects: SubjectRef[],
  roles: TenantAssignmentRoleDraft[],
  validFrom?: string,
  validUntil?: string,
  delegationGrantId?: string,
): { items: TenantAssignmentInput[] } {
  return {
    items: subjects.flatMap((subject) =>
      roles.map(({ role, bindings }) => ({
        subject: { ...subject },
        roleId: role.id,
        scopeBindings: Object.fromEntries(
          Object.entries(bindings).map(([key, binding]) => [
            key,
            { ...binding, ids: [...binding.ids] },
          ]),
        ),
        validFrom,
        validUntil,
        delegationGrantId,
      })),
    ),
  };
}
