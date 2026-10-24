import { describe, expect, it } from "vitest";
import {
  AuditChangeType,
  AuditReferenceState,
  AuditReferenceType,
  AuthorizationDomain,
} from "../../models/iam/constants";
import type { AuditEntry, AuditReferences } from "../../models/iam/types";
import { auditSummary } from "./display";
import { auditChangeLines, formatAuditValue } from "./formatters";

const references: AuditReferences = {
  "member:101": {
    type: AuditReferenceType.MEMBER,
    id: "101",
    state: AuditReferenceState.VISIBLE,
    name: "张三",
  },
  "member:102": {
    type: AuditReferenceType.MEMBER,
    id: "102",
    state: AuditReferenceState.HIDDEN,
  },
  "role:8": {
    type: AuditReferenceType.ROLE,
    id: "8",
    state: AuditReferenceState.DELETED,
    name: "旧角色",
  },
  "department:3": {
    type: AuditReferenceType.DEPARTMENT,
    id: "3",
    state: AuditReferenceState.VISIBLE,
    name: "研发部",
  },
};

const entry = (patch: Partial<AuditEntry>): AuditEntry => ({
  id: "1",
  actor: { accountId: "1", memberId: "101" },
  context: { domain: AuthorizationDomain.TENANT, accountId: "1", memberId: "101" },
  target: { resource: "role", id: "8" },
  changeType: AuditChangeType.UPDATE,
  before: {},
  after: {},
  revisions: {},
  timestamp: "2026-10-24T00:00:00Z",
  ...patch,
});

describe("授权审计差异格式化", () => {
  it("把名称和状态写成完整前后值", () => {
    const summary = auditSummary(
      entry({
        before: { NAME: "研发部", STATUS: "ENABLED" },
        after: { NAME: "研发中心", STATUS: "DISABLED" },
      }),
      references,
    );
    expect(summary).toBe("名称：研发部 → 研发中心；状态：启用 → 停用");
  });

  it("角色、所有者和已删除对象显示名称，无权查看不回退为 ID", () => {
    expect(formatAuditValue("ROLE", "8", references)).toBe("旧角色（已删除）");
    expect(formatAuditValue("OWNER_MEMBER", "101", references)).toBe("张三");
    expect(formatAuditValue("OWNER_MEMBER", "102", references)).toBe("无权查看的成员");
    expect(formatAuditValue("OWNER_MEMBER", "999", references)).toBe("无权查看的成员");
  });

  it("部门负责人展开增删和主负责人", () => {
    const text = formatAuditValue(
      "DEPARTMENT_LEADERS",
      JSON.stringify({ addedMemberIds: ["101"], removedMemberIds: ["102"], primaryMemberId: "101" }),
      references,
    );
    expect(text).toBe("新增：张三；移除：无权查看的成员；主负责人：张三");
  });

  it("历史占位接收对象和导入编码不显示成原文", () => {
    expect(formatAuditValue("RECIPIENT_SELECTION", "before")).toBe("接收对象已调整（未记录明细）");
    const lines = auditChangeLines(
      {},
      { NAME: "member-workbook" },
      references,
      "member-workbook",
    );
    expect(lines).toEqual([]);
  });

  it("损坏的 JSON 显示为无法解析，不抛错", () => {
    expect(formatAuditValue("SCOPE", "{")).toBe("无法解析的配置");
    expect(formatAuditValue("UNKNOWN_FIELD", "raw")).toBe("raw");
  });
});
