/** 当前组织工作台汇总；无读取权限的统计由服务端省略。 */
export interface TenantWorkbenchStatistics {
  tenantId: string;
  tenantName: string;
  tenantAvatar?: string;
  memberCount?: number;
  departmentCount?: number;
  groupCount?: number;
  applicationCount: number;
}
