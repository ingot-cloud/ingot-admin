import { describe, expect, it } from "vitest";
import {
  FieldVisibility,
  IamAction,
  MemberStatus,
  type ResourceDetail,
  type MemberRecord,
  type PlatformMemberContext,
} from "@ingot/admin-common";
import {
  memberCanEditProfile,
  memberCreateProfile,
  memberFieldVisible,
  memberPermissionHeaders,
  memberProfileDraft,
  memberProfilePatch,
} from "./memberFieldAccess";
import { tableHeaders } from "./table";

const detail = (): ResourceDetail<MemberRecord> => ({
  record: {
    id: "1001",
    displayName: "只读名称",
    avatar: "user/avatar/a.png",
    phone: "***",
    status: MemberStatus.ACTIVE,
    departments: [],
  },
  fieldAccess: {
    displayName: { visibility: FieldVisibility.FULL, editable: false },
    avatar: { visibility: FieldVisibility.FULL, editable: true },
    phone: { visibility: FieldVisibility.MASKED, editable: false },
    email: { visibility: FieldVisibility.HIDDEN, editable: false },
  },
  capabilities: { [IamAction.PLATFORM_MEMBER_UPDATE]: { allowed: true } },
  version: "0",
});
describe("平台成员字段与对象编辑", () => {
  it("隐藏或缺失字段关闭展示，脱敏值不进入编辑草稿", () => {
    const row = detail();
    expect(memberFieldVisible(row.fieldAccess, "email")).toBe(false);
    expect(memberFieldVisible({}, "phone")).toBe(false);
    expect(memberFieldVisible(row.fieldAccess, "phone")).toBe(true);
    expect(memberProfileDraft(row)).toEqual({
      displayName: "只读名称",
      avatar: "user/avatar/a.png",
      phone: "",
      email: "",
    });
  });
  it("只修改头像不发送只读显示名、脱敏手机或隐藏邮箱", () => {
    const row = detail();
    const draft = {
      ...memberProfileDraft(row),
      avatar: "user/avatar/new.png",
      displayName: "伪造",
      phone: "13900000000",
      email: "fake@example.com",
    };
    expect(memberProfilePatch(row, draft)).toEqual({ avatar: "user/avatar/new.png" });
    expect(memberProfilePatch(row, memberProfileDraft(row))).toEqual({});
  });
  it("更新对象范围被拒绝时不显示编辑资格且不能产生资料提交", () => {
    const row = detail();
    row.capabilities[IamAction.PLATFORM_MEMBER_UPDATE] = {
      allowed: false,
      reasonCode: "DataScopeDenied",
    };
    row.capabilities[IamAction.PLATFORM_MEMBER_STATUS] = { allowed: true };
    expect(memberCanEditProfile(row)).toBe(false);
    row.capabilities = {};
    expect(memberCanEditProfile(row)).toBe(false);
    expect(memberProfilePatch(row, { ...memberProfileDraft(row), avatar: "fake.png" })).toEqual({});
  });
  it("完整可写字段允许显式清空，但未修改不会发送", () => {
    const row = detail();
    row.fieldAccess.phone = { visibility: FieldVisibility.FULL, editable: true };
    row.record.phone = "13900000000";
    expect(memberProfilePatch(row, memberProfileDraft(row))).toEqual({});
    expect(memberProfilePatch(row, { ...memberProfileDraft(row), phone: "" })).toEqual({
      phone: null,
    });
    row.fieldAccess.avatar.editable = false;
    row.fieldAccess.phone.editable = false;
    expect(memberCanEditProfile(row)).toBe(false);
  });
  it("创建只提交可写资料，不用登录名替代只读显示名", () => {
    const row = detail();
    expect(memberCreateProfile(row.fieldAccess, "登录账号", "user/avatar/a.png")).toEqual({
      avatar: "user/avatar/a.png",
    });
    expect(memberCreateProfile({}, "登录账号", "fake.png")).toEqual({});
  });
  it("邮箱默认列受整份策略控制，空页和跨页不影响列设置", () => {
    expect(tableHeaders.some((header) => header.prop === "email")).toBe(true);
    const context: PlatformMemberContext = {
      listFieldVisibility: {
        displayName: FieldVisibility.FULL,
        phone: FieldVisibility.MASKED,
        email: FieldVisibility.HIDDEN,
      },
      createFieldAccess: {},
      canSearchDisplayName: true,
    };
    expect(
      memberPermissionHeaders(tableHeaders, context).map((header) => header.prop),
    ).not.toContain("email");
    context.listFieldVisibility.email = FieldVisibility.FULL;
    expect(memberPermissionHeaders(tableHeaders, context).map((header) => header.prop)).toContain(
      "email",
    );
    expect(
      memberPermissionHeaders(tableHeaders, undefined).map((header) => header.prop),
    ).not.toContain("phone");
  });
});
