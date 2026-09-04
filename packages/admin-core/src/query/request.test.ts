import { describe, expect, it } from "vitest";
import { silentQueryRequest } from "./request";

describe("silentQueryRequest", () => {
  it("默认静默反馈与进度，并透传 signal", () => {
    const signal = new AbortController().signal;
    expect(silentQueryRequest(signal)).toEqual({
      signal,
      feedback: "silent",
      progress: "silent",
    });
    expect(silentQueryRequest()).toEqual({
      signal: undefined,
      feedback: "silent",
      progress: "silent",
    });
  });
});
