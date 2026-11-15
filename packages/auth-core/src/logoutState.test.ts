import { afterEach, describe, expect, it } from "vitest";
import {
  beginPendingLogout,
  confirmPendingLogout,
  hasPendingLogout,
  readLogoutState,
  assertNoPendingLogout,
  LogoutPendingError,
} from "./logoutState";

afterEach(() => {
  for (const app of ["tenant-admin", "platform-admin"]) {
    const state = readLogoutState(app);
    if (state?.phase === "pending") confirmPendingLogout(app, state.operationId);
  }
});

describe("durable logout intent", () => {
  it("失败和等待时间不会消除原意图，重试不能改绑新上下文", () => {
    const first = beginPendingLogout("tenant-admin", "original");
    expect(hasPendingLogout("tenant-admin")).toBe(true);
    const retry = beginPendingLogout("tenant-admin", "new-context");
    expect(retry.operationId).toBe(first.operationId);
    expect(retry.contextVersion).toBe("original");
    expect(() => assertNoPendingLogout("tenant-admin")).toThrow(LogoutPendingError);
  });
  it("过时确认不能解除另一个注销意图，应用间互相隔离", () => {
    const first = beginPendingLogout("tenant-admin", "original");
    confirmPendingLogout("tenant-admin", first.operationId);
    const next = beginPendingLogout("tenant-admin", "new-context");
    confirmPendingLogout("tenant-admin", first.operationId);
    expect(hasPendingLogout("tenant-admin")).toBe(true);
    expect(readLogoutState("tenant-admin")?.operationId).toBe(next.operationId);
    expect(() => assertNoPendingLogout("platform-admin")).not.toThrow();
  });
  it("相同意图只有服务端成功确认才解除暂停", () => {
    const first = beginPendingLogout("tenant-admin", "original");
    confirmPendingLogout("tenant-admin", first.operationId);
    expect(hasPendingLogout("tenant-admin")).toBe(false);
    expect(readLogoutState("tenant-admin")?.phase).toBe("confirmed");
  });
});
