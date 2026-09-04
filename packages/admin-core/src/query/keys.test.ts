import { describe, expect, it } from "vitest";
import { createResourceQueryKeys } from "./keys";
import { snapshotQueryParams } from "./snapshot";

describe("createResourceQueryKeys", () => {
  it("按 domain/resource/operation 分层", () => {
    const keys = createResourceQueryKeys("platform", "app");
    expect(keys.all).toEqual(["platform", "app"]);
    expect(keys.lists()).toEqual(["platform", "app", "list"]);
    expect(keys.details()).toEqual(["platform", "app", "detail"]);
    expect(keys.detail("a1")).toEqual(["platform", "app", "detail", "a1"]);
  });

  it("列表 Key 使用不可变快照参数", () => {
    const keys = createResourceQueryKeys("security", "session");
    const params = snapshotQueryParams({ current: 1, userId: "u1", password: "secret" });
    expect(keys.list(params)).toEqual(["security", "session", "list", { current: 1, userId: "u1" }]);
  });
});
