import { describe, expect, it } from "vitest";
import { CancelManager } from "./cancel";

describe("CancelManager", () => {
  it("为没有 signal 的请求设置 AbortSignal", () => {
    const manager = new CancelManager();
    const config = { method: "get", url: "/a" };
    manager.addRequest(config);
    expect(config.signal).toBeDefined();
    expect(manager.size()).toBe(1);
    manager.removeRequest(config);
    expect(manager.size()).toBe(0);
  });

  it("外部 AbortSignal 优先，不纳入 CancelManager", () => {
    const manager = new CancelManager();
    const abort = new AbortController();
    const config = { method: "get", url: "/a", signal: abort.signal };
    manager.addRequest(config);
    expect(config.signal).toBe(abort.signal);
    expect(manager.size()).toBe(0);
  });

  it("manualProcessingAbort 时不纳入 CancelManager", () => {
    const manager = new CancelManager();
    const config = { method: "get", url: "/a", manualProcessingAbort: true };
    manager.addRequest(config);
    expect(config.signal).toBeUndefined();
    expect(manager.size()).toBe(0);
  });

  it("abort 会中断已登记请求", () => {
    const manager = new CancelManager();
    const config = { method: "get", url: "/a" };
    manager.addRequest(config);
    const signal = config.signal as AbortSignal;
    manager.abort();
    expect(signal.aborted).toBe(true);
    expect(manager.size()).toBe(0);
  });
});
