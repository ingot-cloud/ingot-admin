import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { OBJECT_ACTION_DENIED_MESSAGE } from "./actionAccess";
import { useCapabilities } from "./useCapabilities";
import { usePermissions } from "@/stores/modules/auth";

describe("useCapabilities", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("会话没有 ACTION 时对象操作一律不允许", () => {
    usePermissions().applyCapabilities({
      actionCodes: [],
      version: "1",
      expiresAt: "2026-09-21T00:00:00Z",
    });
    const { objectAllowed } = useCapabilities();
    expect(objectAllowed({ "iam-platform:tenant:read": { allowed: true } }, "iam-platform:tenant:read")).toEqual({
      allowed: false,
    });
  });

  it("有 ACTION 但列表未返回对象能力时允许操作", () => {
    usePermissions().applyCapabilities({
      actionCodes: ["iam-platform:tenant:read"],
      version: "1",
      expiresAt: "2026-09-21T00:00:00Z",
    });
    const { hasAction, objectAllowed } = useCapabilities();
    expect(hasAction("iam-platform:tenant:read")).toBe(true);
    expect(objectAllowed({}, "iam-platform:tenant:read")).toEqual({ allowed: true });
  });

  it("有 ACTION 且对象明确拒绝时带上原因", () => {
    usePermissions().applyCapabilities({
      actionCodes: ["iam-platform:tenant:read"],
      version: "1",
      expiresAt: "2026-09-21T00:00:00Z",
    });
    const { objectAllowed } = useCapabilities();
    expect(objectAllowed({ "iam-platform:tenant:read": { allowed: false } }, "iam-platform:tenant:read")).toEqual({
      allowed: false,
      message: OBJECT_ACTION_DENIED_MESSAGE,
    });
  });
});
