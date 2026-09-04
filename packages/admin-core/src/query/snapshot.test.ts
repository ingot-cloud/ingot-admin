import { describe, expect, it } from "vitest";
import { snapshotQueryParams } from "./snapshot";

describe("snapshotQueryParams", () => {
  it("生成不可变快照并去掉空值", () => {
    const input = { name: "app", status: "", empty: undefined, count: 1 };
    const snapshot = snapshotQueryParams(input) as Record<string, unknown>;
    expect(snapshot).toEqual({ name: "app", count: 1 });
    input.name = "changed";
    expect(snapshot.name).toBe("app");
  });

  it("排除敏感字段", () => {
    const snapshot = snapshotQueryParams({
      userId: "1",
      password: "secret",
      accessToken: "abc",
      phone: "13800000000",
    }) as Record<string, unknown>;
    expect(snapshot).toEqual({ userId: "1" });
  });

  it("不把 reactive 代理结构保留下来", () => {
    const reactiveInput = reactive({ nested: { id: "1" } });
    const snapshot = snapshotQueryParams(reactiveInput) as { nested: { id: string } };
    expect(snapshot.nested.id).toBe("1");
    expect(snapshot).not.toBe(reactiveInput);
    expect(snapshot.nested).not.toBe(reactiveInput.nested);
  });
});
