import type {
  DepartmentLeaderRecord,
  DepartmentLeaderSummary,
  DepartmentLeaderUpdateInput,
} from "@ingot/admin-common";

/** 摘要只使用已获授权的服务端投影，不推断隐藏负责人数量。 */
export function formatDepartmentLeaderSummary(summary: DepartmentLeaderSummary): string {
  const primary = summary.primaryLeader;
  const name = primary
    ? primary.displayName || "姓名受限"
    : summary.restricted
      ? "主负责人受限"
      : "-";
  const state = primary && !primary.available ? "（不可用，待交接）" : "";
  const count =
    primary && !summary.restricted && summary.visibleCount > 1
      ? ` 和其他 ${summary.visibleCount - 1} 人`
      : "";
  return `${name}${state}${count}${summary.restricted ? " · 部分信息受限" : ""}`;
}

/** 仅编码明确编辑差量，分页未返回的绑定不会被当作删除。 */
export function departmentLeaderDelta(
  version: string,
  added: DepartmentLeaderRecord[],
  removed: Set<string>,
  primaryMemberId?: string,
): DepartmentLeaderUpdateInput {
  return {
    expectedVersion: version,
    addMemberIds: added.map((item) => item.memberId),
    removeMemberIds: [...removed],
    ...(primaryMemberId ? { primaryMemberId } : {}),
  };
}
