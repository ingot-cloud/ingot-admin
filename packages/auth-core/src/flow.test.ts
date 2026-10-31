import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@ingot/http-client";
import type { R } from "@ingot/http-client";
import type { AuthApi } from "./api";
import { createLoginFlow } from "./flow";
import { LoginRecoveryPendingError } from "./errors";
import type { AuthEntry, CompletedLoginResult, LoginResult, TransactionView } from "./types";
const id = "abcdefghijklmnopqrstuvwxyz123456";
const expiry = "2099-01-01T00:00:00Z";
const complete: CompletedLoginResult = {
  transactionId: id,
  stage: "COMPLETED",
  returnTo: "/",
  recoveryExpiresAt: expiry,
};
const result = <T>(data: T) => ({ data }) as R<T>;
const setup = (entry: AuthEntry = "platform") => {
  const api = {
    issueCsrf: vi.fn(async () => result({ csrfToken: "csrf", expiresAt: expiry })),
    ensureCsrf: vi.fn(async () => undefined),
    createTransaction: vi.fn(async () =>
      result({ transactionId: id, stage: "LOGIN" as const, expiresAt: expiry }),
    ),
    login: vi.fn(async (): Promise<R<LoginResult>> => result(complete)),
    selectTenant: vi.fn(async () => result(complete)),
    readTransaction: vi.fn(async (): Promise<R<TransactionView>> =>
      result({ ...complete, sessionEstablished: true }),
    ),
    resume: vi.fn(async () => result(complete)),
    me: vi.fn(async () =>
      result({
        appId: "platform-admin",
        domain: "PLATFORM" as const,
        userId: 1,
        tenantId: null,
        clientId: "client",
      }),
    ),
    logout: vi.fn(async () => result(undefined)),
  } satisfies AuthApi;
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  const wait = vi.fn(async () => undefined);
  return {
    api,
    map,
    wait,
    flow: createLoginFlow(api, { appId: `${entry}-admin`, entry, storage, wait }),
  };
};
describe("click-time login flow", () => {
  it("打开页面无事务无CSRF；重复提交共享一次执行且仅存不透明id", async () => {
    const { api, flow, map } = setup();
    expect(await flow.restore()).toBeNull();
    expect(api.issueCsrf).not.toHaveBeenCalled();
    const first = flow.submit("operator", "memory-only");
    const second = flow.submit("operator", "memory-only");
    expect(first).toBe(second);
    await first;
    expect(api.login).toHaveBeenCalledTimes(1);
    expect([...map.values()]).toEqual([id]);
  });
  it("完成事务刷新恢复复用刚读取的服务端结果，并发确认只请求一次me", async () => {
    const { api, flow, map } = setup();
    map.set("ingot.auth.platform-admin.transaction", id);
    const [first, second] = await Promise.all([flow.restore(), flow.restore()]);
    expect(first).toBe(second);
    expect(first?.stage).toBe("COMPLETED");
    if (first?.stage !== "COMPLETED") throw new Error("expected completed result");
    await Promise.all([flow.confirm(first), flow.confirm(first)]);
    expect(api.readTransaction).toHaveBeenCalledTimes(1);
    expect(api.me).toHaveBeenCalledTimes(1);
    expect(api.resume).not.toHaveBeenCalled();
  });

  it("连续选择组织只发一条请求", async () => {
    const { api, flow, map } = setup("tenant");
    map.set("ingot.auth.tenant-admin.transaction", id);
    const first = flow.select("42");
    const second = flow.select("42");
    expect(first).toBe(second);
    await first;
    expect(api.selectTenant).toHaveBeenCalledTimes(1);
  });

  it("准备失效最多重建一次，不刷新也不丢表单输入", async () => {
    const { api, flow } = setup();
    api.createTransaction.mockRejectedValueOnce({ code: "BFF_BINDING_MISMATCH" });
    await flow.submit("operator", "memory-only");
    expect(api.createTransaction).toHaveBeenCalledTimes(2);
    expect(api.login).toHaveBeenCalledWith("operator", "memory-only", id);
  });
  it("密码请求明确过期不能自动重放", async () => {
    const { api, flow } = setup();
    api.login.mockRejectedValueOnce({ code: "BFF_TRANSACTION_EXPIRED" });
    await expect(flow.submit("operator", "password")).rejects.toMatchObject({
      code: "BFF_TRANSACTION_EXPIRED",
    });
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(api.createTransaction).toHaveBeenCalledTimes(1);
  });
  it("丢响应查询本次事务，不能直接拿旧me判成功", async () => {
    const { api, flow } = setup();
    api.login.mockRejectedValueOnce(new ApiError({ kind: "network", message: "lost", code: "-1" }));
    await expect(flow.submit("operator", "password")).resolves.toEqual(
      expect.objectContaining({ stage: "COMPLETED" }),
    );
    expect(api.readTransaction).toHaveBeenCalledWith(id, expect.any(Number));
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(api.me).not.toHaveBeenCalled();
  });
  it("浏览器自动重传导致nonce重复时只查原事务，不重放认证", async () => {
    const { api, flow } = setup();
    api.login.mockRejectedValueOnce({ code: "replay_nonce_dup", status: 400 });
    await expect(flow.submit("operator", "password")).resolves.toEqual(
      expect.objectContaining({ stage: "COMPLETED" }),
    );
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(api.readTransaction).toHaveBeenCalledWith(id, expect.any(Number));
  });
  it("本次Cookie未建立时仅resume一次，再核对并me确认", async () => {
    const { api, flow } = setup();
    api.readTransaction.mockResolvedValueOnce(result({ ...complete, sessionEstablished: false }));
    await flow.confirm(complete);
    expect(api.resume).toHaveBeenCalledTimes(1);
    expect(api.me).toHaveBeenCalledTimes(1);
  });
  it("Cookie持续拒绝停止恢复，不循环认证", async () => {
    const { api, flow } = setup();
    api.readTransaction.mockResolvedValue(result({ ...complete, sessionEstablished: false }));
    await expect(flow.confirm(complete)).rejects.toThrow("Cookie");
    expect(api.resume).toHaveBeenCalledTimes(1);
    expect(api.me).not.toHaveBeenCalled();
    expect(api.login).not.toHaveBeenCalled();
  });
  it("处理中查询有界保留线索，便于用户再确认", async () => {
    const { api, flow, wait } = setup();
    api.login.mockRejectedValueOnce({ status: 503 });
    api.readTransaction.mockResolvedValue(
      result({ transactionId: id, stage: "UNKNOWN", expiresAt: expiry }),
    );
    await expect(flow.submit("operator", "password")).rejects.toBeInstanceOf(
      LoginRecoveryPendingError,
    );
    expect(api.readTransaction).toHaveBeenCalledTimes(15);
    expect(wait).toHaveBeenCalledTimes(14);
    expect(flow.transaction()).toBe(id);
  });
  it("租户选择503且结果UNKNOWN时仅有界查询，不重复选择或提交密码", async () => {
    const { api, flow, wait } = setup("tenant");
    api.login.mockResolvedValueOnce(
      result({
        transactionId: id,
        stage: "SELECT_TENANT",
        expiresAt: expiry,
        allows: [
          { id: "42", name: "A" },
          { id: "43", name: "B" },
        ],
      }),
    );
    await flow.submit("operator", "memory-only");
    api.selectTenant.mockRejectedValueOnce({ code: "BFF_AUTH_UNAVAILABLE", status: 503 });
    api.readTransaction.mockResolvedValue(
      result({ transactionId: id, stage: "UNKNOWN", expiresAt: expiry }),
    );
    await expect(flow.select("42")).rejects.toBeInstanceOf(LoginRecoveryPendingError);
    expect(api.selectTenant).toHaveBeenCalledTimes(1);
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(api.readTransaction).toHaveBeenCalledTimes(15);
    expect(wait).toHaveBeenCalledTimes(14);
    expect(flow.transaction()).toBe(id);
    flow.reset();
    expect(flow.transaction()).toBeUndefined();
  });
  it("CSRF修复后必须原绑定GET仍为LOGIN才可再发密码", async () => {
    const { api, flow } = setup();
    api.login.mockRejectedValueOnce({ code: "BFF_CSRF_INVALID" });
    api.readTransaction.mockResolvedValueOnce(
      result({ transactionId: id, stage: "LOGIN", expiresAt: expiry }),
    );
    await flow.submit("operator", "password");
    expect(api.issueCsrf).toHaveBeenCalledTimes(1);
    expect(api.login).toHaveBeenCalledTimes(2);
  });
  it("刷新恢复仅使用本标签线索；新绑定不能认领旧结果", async () => {
    const { api, flow } = setup();
    await flow.submit("operator", "password");
    api.readTransaction.mockRejectedValueOnce({ code: "BFF_BINDING_MISMATCH" });
    await expect(flow.restore()).rejects.toMatchObject({ code: "BFF_BINDING_MISMATCH" });
    expect(api.resume).not.toHaveBeenCalled();
    expect(api.login).toHaveBeenCalledTimes(1);
  });
});
