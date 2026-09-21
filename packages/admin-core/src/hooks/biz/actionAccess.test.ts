import { describe, expect, it } from "vitest";
import {
  ACTION_UNAVAILABLE_MESSAGE,
  OBJECT_ACTION_DENIED_MESSAGE,
  disabledActionHint,
  objectActionAllowed,
  resolveActionAccess,
} from "./actionAccess";

describe("objectActionAllowed", () => {
  it("未返回对象能力时不视为拒绝", () => {
    expect(objectActionAllowed(undefined, "iam-platform:tenant:read")).toEqual({ allowed: true });
    expect(objectActionAllowed({}, "iam-platform:tenant:read")).toEqual({ allowed: true });
  });

  it("对象明确允许时放行", () => {
    expect(
      objectActionAllowed(
        { "iam-platform:tenant:read": { allowed: true, message: "当前对象允许该操作" } },
        "iam-platform:tenant:read",
      ),
    ).toEqual({ allowed: true, message: "当前对象允许该操作" });
  });

  it("对象明确拒绝时禁用并保留原因，缺文案时给兜底提示", () => {
    expect(
      objectActionAllowed(
        { "iam-platform:tenant:read": { allowed: false, message: "超出数据范围" } },
        "iam-platform:tenant:read",
      ),
    ).toEqual({ allowed: false, message: "超出数据范围" });
    expect(
      objectActionAllowed({ "iam-platform:tenant:read": { allowed: false } }, "iam-platform:tenant:read"),
    ).toEqual({ allowed: false, message: OBJECT_ACTION_DENIED_MESSAGE });
  });
});

describe("resolveActionAccess", () => {
  it("没有会话 ACTION 时隐藏，不显示禁用按钮", () => {
    expect(
      resolveActionAccess("iam-platform:tenant:read", {
        hasAction: false,
        capabilities: { "iam-platform:tenant:read": { allowed: true } },
      }),
    ).toEqual({ visible: false, allowed: false });
  });

  it("有 ACTION 且对象未声明能力时允许进入详情", () => {
    expect(
      resolveActionAccess("iam-platform:tenant:read", {
        hasAction: true,
        capabilities: {},
      }),
    ).toEqual({ visible: true, allowed: true });
  });
});

describe("disabledActionHint", () => {
  it("禁用且无原因时给出兜底提示", () => {
    expect(disabledActionHint(false, "超出数据范围")).toBeUndefined();
    expect(disabledActionHint(true, "超出数据范围")).toBe("超出数据范围");
    expect(disabledActionHint(true, "  ")).toBe(ACTION_UNAVAILABLE_MESSAGE);
  });
});
