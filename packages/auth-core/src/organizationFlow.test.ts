import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrganizationSwitchFlow, OrganizationSwitchPendingError } from "./organizationFlow";
import { rememberSessionContext, clearSessionContext } from "./context";
import type { AuthApi } from "./api";
import type { OrganizationSwitchView, SessionMe } from "./types";

const id = "transaction-0123456789012345";
const identity: SessionMe = {
  appId: "tenant-admin",
  domain: "TENANT",
  tenantId: "43",
  userId: 1,
  clientId: "client",
  contextVersion: id,
};
const completed: OrganizationSwitchView = {
  transactionId: id,
  tenantId: "43",
  stage: "COMPLETED",
  expiresAt: "2099-01-01T00:00:00Z",
  sessionEstablished: true,
};
const fixture = () => {
  const api = {
    createOrganizationSwitch: vi
      .fn()
      .mockResolvedValue({ data: { ...completed, stage: "PREPARED" } }),
    commitOrganizationSwitch: vi.fn().mockResolvedValue({ data: completed }),
    readOrganizationSwitch: vi.fn().mockResolvedValue({ data: completed }),
    resumeOrganizationSwitch: vi.fn().mockResolvedValue({ data: completed }),
    me: vi.fn().mockResolvedValue({ data: identity }),
  };
  return { api, flowApi: api as unknown as AuthApi };
};
beforeEach(() => {
  clearSessionContext();
  rememberSessionContext({ ...identity, tenantId: "42", contextVersion: "source-version" });
});

describe("organization switch flow", () => {
  it("合并重复点击，确认本次 Cookie 与实际 me 后完成", async () => {
    const { api, flowApi } = fixture();
    const pending = vi.fn();
    const flow = createOrganizationSwitchFlow(flowApi, { onPending: pending });
    const a = flow.start("43");
    const b = flow.start("44");
    expect(a).toBe(b);
    expect((await a).identity).toEqual(identity);
    expect(api.createOrganizationSwitch).toHaveBeenCalledExactlyOnceWith("43");
    expect(api.commitOrganizationSwitch).toHaveBeenCalledOnce();
    expect(pending).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: id }),
      "source-version",
    );
    expect(api.resumeOrganizationSwitch).not.toHaveBeenCalled();
  });
  it("提交响应丢失只查原事务，不重新创建或签发", async () => {
    const { api, flowApi } = fixture();
    api.commitOrganizationSwitch.mockRejectedValueOnce(new Error("lost reply"));
    const flow = createOrganizationSwitchFlow(flowApi, { onPending: vi.fn() });
    await flow.start("43");
    expect(api.createOrganizationSwitch).toHaveBeenCalledOnce();
    expect(api.commitOrganizationSwitch).toHaveBeenCalledOnce();
    expect(api.me).toHaveBeenCalledOnce();
  });
  it("Cookie 未投递只恢复同一结果一次", async () => {
    const { api, flowApi } = fixture();
    api.readOrganizationSwitch.mockResolvedValueOnce({
      data: { ...completed, sessionEstablished: false },
    });
    await createOrganizationSwitchFlow(flowApi, { onPending: vi.fn() }).start("43");
    expect(api.resumeOrganizationSwitch).toHaveBeenCalledExactlyOnceWith(
      id,
      expect.any(AbortSignal),
    );
    expect(api.createOrganizationSwitch).toHaveBeenCalledOnce();
  });
  it("旧 me 或不同组织不能被当成本次切换成功", async () => {
    const { api, flowApi } = fixture();
    api.me.mockResolvedValue({
      data: { ...identity, tenantId: "42", contextVersion: "source-version" },
    });
    await expect(
      createOrganizationSwitchFlow(flowApi, { onPending: vi.fn() }).start("43"),
    ).rejects.toThrow("组织会话已变化");
  });
  it("结果查询有界，超出预算保持可恢复状态", async () => {
    const { api, flowApi } = fixture();
    api.readOrganizationSwitch.mockResolvedValue({ data: { ...completed, stage: "ISSUING" } });
    let now = 0;
    const flow = createOrganizationSwitchFlow(flowApi, {
      onPending: vi.fn(),
      now: () => now,
      wait: async (ms) => {
        now += ms;
      },
    });
    await expect(flow.start("43")).rejects.toBeInstanceOf(OrganizationSwitchPendingError);
    expect(api.readOrganizationSwitch.mock.calls.length).toBeLessThanOrEqual(15);
    expect(flow.hasPending()).toBe(true);
  });
  it("节点中断后通过原操作结果继续提交，不创建新事务", async () => {
    const { api, flowApi } = fixture();
    api.readOrganizationSwitch.mockResolvedValueOnce({
      data: { ...completed, stage: "COMMITTING" },
    });
    const result = await createOrganizationSwitchFlow(flowApi, {
      onPending: vi.fn(),
      wait: async () => undefined,
    }).restore(id);
    expect(result?.identity).toEqual(identity);
    expect(api.createOrganizationSwitch).not.toHaveBeenCalled();
    expect(api.commitOrganizationSwitch).toHaveBeenCalledExactlyOnceWith(
      id,
      expect.any(AbortSignal),
    );
  });
  it("提交和结果查询依赖故障时保留恢复线索", async () => {
    const { api, flowApi } = fixture();
    const failure = { status: 503, code: "BFF_AUTH_UNAVAILABLE" };
    api.commitOrganizationSwitch.mockRejectedValueOnce(failure);
    api.readOrganizationSwitch.mockRejectedValueOnce(failure);
    const flow = createOrganizationSwitchFlow(flowApi, { onPending: vi.fn() });
    await expect(flow.start("43")).rejects.toBeInstanceOf(OrganizationSwitchPendingError);
    expect(flow.hasPending()).toBe(true);
    expect(api.createOrganizationSwitch).toHaveBeenCalledOnce();
  });
});
