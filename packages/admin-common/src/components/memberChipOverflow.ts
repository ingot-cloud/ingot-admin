export const MEMBER_CHIP_LIMIT = 5;

export interface MemberChip {
  id: string;
  name: string;
  avatar?: string;
}

export function visibleMembers<T>(items: T[], limit = MEMBER_CHIP_LIMIT): T[] {
  return items.slice(0, limit);
}

export function overflowCount(total: number, limit = MEMBER_CHIP_LIMIT): number {
  return Math.max(0, total - limit);
}
