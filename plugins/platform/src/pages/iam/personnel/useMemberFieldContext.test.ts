import { effectScope, nextTick, ref } from "vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCapabilities, type R } from "@ingot/admin-core";
import { FieldVisibility, type PlatformMemberContext } from "@ingot/admin-common";
import { useMemberFieldContext } from "./useMemberFieldContext";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/api/iam/personnel", () => ({ PlatformMemberContextAPI: api }));
vi.mock("@ingot/admin-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-core")>();
  const { ref } = await import("vue");
  const capabilities = {
    unavailable: ref(false),
    contextEpoch: ref(0),
    version: ref("1"),
    hasAction: () => true,
  };
  return { ...actual, useCapabilities: () => capabilities };
});
const capabilities = useCapabilities();
const value = (email: FieldVisibility): PlatformMemberContext => ({
  listFieldVisibility: { email },
  createFieldAccess: {},
  canSearchDisplayName: false,
});
beforeEach(() => {
  api.mockReset();
  capabilities.contextEpoch.value = 0;
  capabilities.unavailable.value = false;
});
describe("成员字段上下文请求", () => {
  it("未激活成员视图不请求，激活一次加载一次", async () => {
    api.mockResolvedValue({ data: value(FieldVisibility.HIDDEN) });
    const scope = effectScope();
    const active = ref(false);
    const context = scope.run(() => useMemberFieldContext(active))!;
    expect(api).not.toHaveBeenCalled();
    active.value = true;
    await flushPromises();
    expect(api).toHaveBeenCalledTimes(1);
    expect(context.context.value?.listFieldVisibility.email).toBe(FieldVisibility.HIDDEN);
    scope.stop();
  });
  it("身份变化使旧完整可见响应失效，保持新身份隐藏结果", async () => {
    let finish!: (value: Partial<R<PlatformMemberContext>>) => void;
    api
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValue({ data: value(FieldVisibility.HIDDEN) });
    const scope = effectScope();
    const context = scope.run(() => useMemberFieldContext(ref(true)))!;
    capabilities.contextEpoch.value += 1;
    await flushPromises();
    finish({ data: value(FieldVisibility.FULL) });
    await flushPromises();
    expect(context.context.value?.listFieldVisibility.email).toBe(FieldVisibility.HIDDEN);
    expect(api).toHaveBeenCalledTimes(2);
    scope.stop();
  });
  it("加载失败不放开列，重试可恢复；授权不可用时立即关闭展示", async () => {
    api
      .mockRejectedValueOnce(new Error("不可用"))
      .mockResolvedValue({ data: value(FieldVisibility.MASKED) });
    const scope = effectScope();
    const context = scope.run(() => useMemberFieldContext(ref(true)))!;
    await flushPromises();
    expect(context.context.value).toBeUndefined();
    expect(context.contextError.value).toBe(true);
    await context.refreshContext();
    expect(context.context.value?.listFieldVisibility.email).toBe(FieldVisibility.MASKED);
    capabilities.unavailable.value = true;
    await nextTick();
    expect(context.context.value).toBeUndefined();
    expect(api).toHaveBeenCalledTimes(2);
    scope.stop();
  });
});
