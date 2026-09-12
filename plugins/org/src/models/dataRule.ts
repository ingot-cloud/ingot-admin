export interface RoleDataRuleItemDTO {
  permissionId?: string;
  resourceId?: string;
  scopeType?: number;
  scopes?: Array<string>;
}

export interface RoleDataRuleSetDTO {
  items: Array<RoleDataRuleItemDTO>;
}

export interface RoleDataRuleVO extends RoleDataRuleItemDTO {
  id?: string;
  roleId?: string;
  tenantId?: string;
  platformRole?: boolean;
}
