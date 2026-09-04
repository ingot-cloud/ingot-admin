import { describe, expect, it, vi } from "vitest";
import { ProgressCounter } from "./progress";

describe("ProgressCounter", () => {
  it("并发请求计数归零才 done", () => {
    const start = vi.fn();
    const done = vi.fn();
    const counter = new ProgressCounter({ start, done });

    counter.start();
    counter.start();
    expect(start).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();
    expect(counter.pending).toBe(2);

    counter.done();
    expect(done).not.toHaveBeenCalled();
    counter.done();
    expect(done).toHaveBeenCalledTimes(1);
    expect(counter.pending).toBe(0);
  });

  it("多余的 done 不会把计数打成负数", () => {
    const start = vi.fn();
    const done = vi.fn();
    const counter = new ProgressCounter({ start, done });
    counter.done();
    expect(done).not.toHaveBeenCalled();
    expect(counter.pending).toBe(0);
  });
});
