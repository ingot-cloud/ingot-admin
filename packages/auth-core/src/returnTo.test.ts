import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./returnTo";

describe("sanitizeReturnTo", () => {
  it("keeps a relative path", () => {
    expect(sanitizeReturnTo("/org/members?q=1#top")).toBe("/org/members?q=1#top");
  });

  it("rejects absolute urls and protocol-relative paths", () => {
    expect(sanitizeReturnTo("https://evil.example/")).toBeNull();
    expect(sanitizeReturnTo("//evil.example")).toBeNull();
    expect(sanitizeReturnTo("/\\evil")).toBeNull();
  });
});
