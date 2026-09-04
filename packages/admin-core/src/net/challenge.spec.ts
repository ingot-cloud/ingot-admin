import type { AxiosError, AxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { R } from "@ingot/http-client";

const runGatewayChallenge = vi.fn();

vi.mock("@ingot/shared", () => ({
  runGatewayChallenge: (...args: unknown[]) => runGatewayChallenge(...args),
}));

const { bindChallengeRetry, tryHandleGatewayChallenge } = await import("./challenge");

describe("412 挑战重试", () => {
  beforeEach(() => {
    runGatewayChallenge.mockReset();
  });

  it("挑战通过后使用明文重试原请求", async () => {
    const retry = vi.fn(async (config: AxiosRequestConfig) => ({
      code: "S0200",
      message: "ok",
      data: { retried: true },
      config,
    }));
    bindChallengeRetry(retry);

    runGatewayChallenge.mockImplementation(async ({ retry: next }: { retry: (headers: Record<string, string>, count: number) => Promise<R> }) =>
      next({ "X-Pass": "token" }, 1),
    );

    const error = {
      config: {
        url: "/api/me",
        data: { cipher: true },
        __cryptoPlainData: { name: "plain" },
        headers: new AxiosHeaders(),
      },
      response: { status: 412, data: { code: "CHALLENGE_REQUIRED" } },
    } as AxiosError<R>;

    const result = await tryHandleGatewayChallenge(error);
    expect(retry).toHaveBeenCalledTimes(1);
    const retriedConfig = retry.mock.calls[0][0];
    expect(retriedConfig.data).toEqual({ name: "plain" });
    expect(retriedConfig.__cryptoCtx).toBeUndefined();
    expect(retriedConfig.__challengeRetryCount).toBe(1);
    expect(result).toMatchObject({ data: { retried: true } });
  });

  it("非挑战错误不重试", async () => {
    runGatewayChallenge.mockResolvedValue(undefined);
    const error = {
      config: { url: "/api/me" },
      response: { status: 500, data: {} },
    } as AxiosError<R>;
    await expect(tryHandleGatewayChallenge(error)).resolves.toBeUndefined();
  });
});
