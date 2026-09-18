import { describe, expect, it, vi } from "vitest";
import { createRowActions, createToolbarActions, TABLE_ID, type Row } from "./table";

vi.mock("@ingot/admin-common", () => ({
  IamAction: {
    PLATFORM_ACCOUNT_CREATE: "iam-platform:account:create",
    PLATFORM_ACCOUNT_READ: "iam-platform:account:read",
    PLATFORM_ACCOUNT_ENABLE: "iam-platform:account:enable",
    PLATFORM_ACCOUNT_DISABLE: "iam-platform:account:disable",
    PLATFORM_ACCOUNT_LOCK: "iam-platform:account:lock",
    PLATFORM_ACCOUNT_UNLOCK: "iam-platform:account:unlock",
    PLATFORM_ACCOUNT_RESET_PASSWORD: "iam-platform:account:reset-password",
    PLATFORM_ACCOUNT_DELETE: "iam-platform:account:delete",
  },
  objectActionAllowed: (
    capabilities: Record<string, { allowed?: boolean; message?: string }> | undefined,
    actionCode: string,
  ) => ({
    allowed: capabilities?.[actionCode]?.allowed === true,
    message: capabilities?.[actionCode]?.message,
  }),
}));

const row = (overrides: Partial<Row["record"]> = {}): Row => ({
  record: {
    id: "a1",
    username: "alice",
    enabled: true,
    locked: false,
    ...overrides,
  },
  fieldAccess: {},
  capabilities: {
    "iam-platform:account:read": { allowed: true },
    "iam-platform:account:enable": { allowed: true },
    "iam-platform:account:disable": { allowed: true },
    "iam-platform:account:lock": { allowed: true },
    "iam-platform:account:unlock": { allowed: true },
    "iam-platform:account:reset-password": { allowed: true },
    "iam-platform:account:delete": { allowed: true },
  },
  version: "1",
});

const handlers = {
  onDetail: () => undefined,
  onEnable: () => undefined,
  onDisable: () => undefined,
  onLock: () => undefined,
  onUnlock: () => undefined,
  onResetPassword: () => undefined,
  onDelete: () => undefined,
};

describe("platform iam accounts table", () => {
  it("提供稳定 tableId 与创建入口", () => {
    expect(TABLE_ID).toBe("platform-iam-accounts");
    expect(createToolbarActions(() => undefined)[0]?.permission).toBe("iam-platform:account:create");
  });

  it("启停与锁定按账号状态互斥展示", () => {
    const enabled = createRowActions(row(), handlers).map((item) => item.key);
    expect(enabled).toContain("disable");
    expect(enabled).not.toContain("enable");
    expect(enabled).toContain("lock");
    expect(enabled).not.toContain("unlock");

    const locked = createRowActions(row({ enabled: false, locked: true }), handlers).map(
      (item) => item.key,
    );
    expect(locked).toContain("enable");
    expect(locked).toContain("unlock");
    expect(locked).not.toContain("disable");
    expect(locked).not.toContain("lock");
  });
});
