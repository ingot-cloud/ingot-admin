import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUserInfoStore } from "./auth";
import { useHeaderSearchStore } from "./headerSearch";

describe("useHeaderSearchStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("按当前用户隔离历史，去重置顶，清空只影响当前用户", () => {
    const userStore = useUserInfoStore();
    const searchStore = useHeaderSearchStore();

    userStore.userInfo.user = { phone: "13800000001" };
    searchStore.pushKeyword("部门");
    searchStore.pushKeyword("成员");
    searchStore.pushKeyword("部门");
    expect(searchStore.history).toEqual(["部门", "成员"]);

    userStore.userInfo.user = { phone: "13800000002" };
    expect(searchStore.history).toEqual([]);
    searchStore.pushKeyword("审计");
    expect(searchStore.history).toEqual(["审计"]);

    userStore.userInfo.user = { phone: "13800000001" };
    searchStore.clearHistory();
    expect(searchStore.history).toEqual([]);
    userStore.userInfo.user = { phone: "13800000002" };
    expect(searchStore.history).toEqual(["审计"]);
  });
});
