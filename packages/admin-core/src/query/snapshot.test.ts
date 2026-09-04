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

  it("排除敏感字段明文并写入指纹", () => {
    const snapshot = snapshotQueryParams({
      userId: "1",
      password: "secret",
      accessToken: "abc",
      phone: "13800000000",
    }) as Record<string, unknown>;
    expect(snapshot.userId).toBe("1");
    expect(snapshot.phone).toBeUndefined();
    expect(snapshot.password).toBeUndefined();
    expect(snapshot.accessToken).toBeUndefined();
    expect(typeof snapshot._sensitive).toBe("string");
    expect(String(snapshot._sensitive)).not.toContain("13800000000");
    expect(JSON.stringify(snapshot)).not.toContain("13800000000");
  });

  it("不同手机号得到不同指纹", () => {
    const first = snapshotQueryParams({
      current: 1,
      size: 20,
      condition: { nickname: "a", phone: "13800000000" },
    }) as Record<string, unknown>;
    const second = snapshotQueryParams({
      current: 1,
      size: 20,
      condition: { nickname: "a", phone: "13900000000" },
    }) as Record<string, unknown>;
    expect(first._sensitive).not.toBe(second._sensitive);
    expect(JSON.stringify(first)).not.toContain("13800000000");
    expect(JSON.stringify(second)).not.toContain("13900000000");
  });

  it("无敏感字段时不写指纹", () => {
    const snapshot = snapshotQueryParams({
      current: 1,
      size: 20,
      condition: { nickname: "a" },
    }) as Record<string, unknown>;
    expect(snapshot._sensitive).toBeUndefined();
  });

  it("不把 reactive 代理结构保留下来", () => {
    const reactiveInput = reactive({ nested: { id: "1" } });
    const snapshot = snapshotQueryParams(reactiveInput) as { nested: { id: string } };
    expect(snapshot.nested.id).toBe("1");
    expect(snapshot).not.toBe(reactiveInput);
    expect(snapshot.nested).not.toBe(reactiveInput.nested);
  });
});
