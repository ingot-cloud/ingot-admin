import { describe, expect, it, vi } from "vitest";
import { MemberUserPageQueryOptions, memberUserQueryKeys } from "./user.query";

vi.mock("@ingot/admin-core", () => ({
  createResourceQueryKeys: (domain: string, resource: string) => {
    const all = [domain, resource] as const;
    return {
      all,
      lists: () => [...all, "list"] as const,
      list: (params: unknown) => [...all, "list", params] as const,
      details: () => [...all, "detail"] as const,
      detail: (id: string) => [...all, "detail", id] as const,
    };
  },
  createPageQueryOptions: (keys: { list: (params: unknown) => unknown }, fetchPage: unknown) => {
    return (input: { current: number; size: number; condition: Record<string, unknown> }) => {
      const condition = { ...input.condition };
      const phone = condition.phone;
      delete condition.phone;
      if (phone) {
        condition._sensitive = String(phone).length;
      }
      return {
        queryKey: keys.list({
          current: input.current,
          size: input.size,
          condition,
        }),
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          (fetchPage as (page: unknown, condition: unknown, options: unknown) => Promise<{ data: unknown }>)(
            { current: input.current, size: input.size },
            { ...input.condition },
            { signal, feedback: "silent", progress: "silent" },
          ).then((response) => response.data),
      };
    };
  },
  silentQueryRequest: (signal?: AbortSignal) => ({
    signal,
    feedback: "silent",
    progress: "silent",
  }),
}));

vi.mock("./user", () => ({
  UserPageAPI: vi.fn(() => Promise.resolve({ data: { current: 1, size: 20, total: 0, records: [] } })),
  UserProfileAPI: vi.fn(),
}));

describe("MemberUserPageQueryOptions", () => {
  it("列表 Key 分层且 queryFn 透传完整 condition", async () => {
    const { UserPageAPI } = await import("./user");
    expect(memberUserQueryKeys.lists()).toEqual(["member", "user", "list"]);
    const options = MemberUserPageQueryOptions({
      current: 1,
      size: 20,
      condition: { nickname: "a", phone: "13800000000" },
    });
    expect(JSON.stringify(options.queryKey)).not.toContain("13800000000");
    const signal = new AbortController().signal;
    await (options.queryFn as (context: { signal: AbortSignal }) => Promise<unknown>)({ signal });
    expect(UserPageAPI).toHaveBeenCalledWith(
      { current: 1, size: 20 },
      { nickname: "a", phone: "13800000000" },
      { signal, feedback: "silent", progress: "silent" },
    );
  });
});
