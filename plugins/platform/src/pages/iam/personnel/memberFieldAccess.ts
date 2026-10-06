import {
  FieldVisibility,
  IamAction,
  isFieldEditable,
  type FieldAccessMap,
  type MemberRecord,
  type PlatformMemberContext,
  type ResourceDetail,
} from "@ingot/admin-common";
import type { TableHeaderRecord } from "@ingot/admin-core";

export const MEMBER_PROFILE_FIELDS = ["displayName", "avatar", "phone", "email"] as const;
type ProfileKey = (typeof MEMBER_PROFILE_FIELDS)[number];
export type MemberProfileDraft = Record<Exclude<ProfileKey, "avatar">, string> & {
  avatar: string | undefined;
};

/** 平台字段缺少结果时关闭展示，不能回退为可见。 */
export function memberFieldVisible(access: FieldAccessMap | undefined, key: string): boolean {
  const field = access?.[key];
  return Boolean(field && field.visibility !== FieldVisibility.HIDDEN);
}

export function memberCanEditProfile(detail: ResourceDetail<MemberRecord> | undefined): boolean {
  return Boolean(
    detail &&
    detail.capabilities[IamAction.PLATFORM_MEMBER_UPDATE]?.allowed === true &&
    MEMBER_PROFILE_FIELDS.some((key) => isFieldEditable(detail.fieldAccess, key)),
  );
}

/** 脱敏值和隐藏值不进入编辑草稿；只读完整值仍可用于只读展示。 */
export function memberProfileDraft(detail: ResourceDetail<MemberRecord>): MemberProfileDraft {
  const value = (key: ProfileKey): string | undefined =>
    detail.fieldAccess[key]?.visibility === FieldVisibility.FULL
      ? (detail.record[key] ?? undefined)
      : undefined;
  return {
    displayName: value("displayName") ?? "",
    phone: value("phone") ?? "",
    email: value("email") ?? "",
    avatar: value("avatar"),
  };
}

/** 只发送当前对象允许编辑且用户实际改动的字段，空草稿不会清空不可写原值。 */
export function memberProfilePatch(
  detail: ResourceDetail<MemberRecord>,
  draft: MemberProfileDraft,
): Partial<Record<ProfileKey, string>> {
  if (!memberCanEditProfile(detail)) return {};
  const patch: Partial<Record<ProfileKey, string>> = {};
  for (const key of MEMBER_PROFILE_FIELDS) {
    if (!isFieldEditable(detail.fieldAccess, key)) continue;
    const next = key === "avatar" ? (draft[key] ?? "") : draft[key].trim();
    if (next !== (detail.record[key] ?? "")) patch[key] = next;
  }
  return patch;
}

/** 创建时不可写显示名不回传登录名，交由服务器采用既定默认值。 */
export function memberCreateProfile(
  access: FieldAccessMap,
  displayName: string,
  avatar: string | undefined,
): { displayName?: string; avatar?: string } {
  const profile: { displayName?: string; avatar?: string } = {};
  if (isFieldEditable(access, "displayName") && displayName.trim())
    profile.displayName = displayName.trim();
  if (isFieldEditable(access, "avatar") && avatar !== undefined) profile.avatar = avatar;
  return profile;
}

/** 列概览仅决定布局，不能用于逐行展示原值或证明查询/写入资格。 */
export function memberPermissionHeaders(
  headers: TableHeaderRecord[],
  context: PlatformMemberContext | undefined,
): TableHeaderRecord[] {
  return headers.filter((header) => {
    if (!MEMBER_PROFILE_FIELDS.some((key) => key === header.prop)) return true;
    const visibility = context?.listFieldVisibility[header.prop ?? ""];
    return visibility !== undefined && visibility !== FieldVisibility.HIDDEN;
  });
}
