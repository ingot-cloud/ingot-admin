import { describe, expect, it, vi } from "vitest";
import { ConfigurationStatus, EntitlementSource } from "@ingot/admin-common";
import {
  extraDraftsOf,
  extraIdsForResolve,
  extraSelectOptionsOf,
  formatValidity,
  isLockedEntitlement,
  isRemovableEntitlement,
  toPreviewItems,
} from "./wizard";

vi.mock("@ingot/admin-common", () => ({
  ConfigurationStatus: {
    ENABLED: "ENABLED",
    DISABLED: "DISABLED",
  },
  EntitlementSource: {
    INITIALIZATION: "INITIALIZATION",
    MANUAL: "MANUAL",
    PLAN: "PLAN",
  },
}));

describe("tenant entitlement drafts", () => {
  it("按自选 ID 生成覆盖草稿，不把套餐行算进并集", () => {
    const items = [
      {
        applicationId: "1",
        applicationName: "基础",
        source: EntitlementSource.PLAN,
        status: ConfigurationStatus.ENABLED,
      },
      {
        applicationId: "2",
        applicationName: "自选",
        source: EntitlementSource.MANUAL,
        status: ConfigurationStatus.ENABLED,
        validUntil: "2026-12-31 23:59:59",
      },
    ];
    expect(extraDraftsOf(items, ["2"])).toEqual([
      {
        applicationId: "2",
        status: ConfigurationStatus.ENABLED,
        validUntil: "2026-12-31 23:59:59",
      },
    ]);
    expect(isRemovableEntitlement(items[0])).toBe(false);
    expect(isRemovableEntitlement(items[1])).toBe(true);
    expect(isLockedEntitlement(items[0])).toBe(true);
    expect(isLockedEntitlement(items[1])).toBe(false);
    expect(formatValidity(undefined, undefined)).toBe("无限使用");
  });

  it("编辑回填只把手动行当自选，不把未见过的默认行当覆盖", () => {
    const items = [
      {
        applicationId: "1",
        applicationName: "基础",
        source: EntitlementSource.INITIALIZATION,
        status: ConfigurationStatus.ENABLED,
      },
      {
        applicationId: "2",
        applicationName: "自选",
        source: EntitlementSource.MANUAL,
        status: ConfigurationStatus.ENABLED,
        validUntil: "2026-12-31 23:59:59",
      },
    ];
    expect(extraSelectOptionsOf(items)).toEqual([{ id: "2", name: "自选" }]);
    expect(extraIdsForResolve(items, ["2"], [])).toEqual(["2"]);
    expect(
      extraIdsForResolve(
        [{ ...items[0], validUntil: "2029-09-21 00:00:00" }, items[1]],
        ["2"],
        extraDraftsOf(items, ["1", "2"]),
      ),
    ).toEqual(["2", "1"]);
  });

  it("把 preview 并集映射为页内开通行", () => {
    expect(
      toPreviewItems([
        {
          applicationId: "3",
          applicationName: "治理",
          status: ConfigurationStatus.ENABLED,
          source: EntitlementSource.INITIALIZATION,
        },
      ]),
    ).toEqual([
      {
        applicationId: "3",
        applicationName: "治理",
        status: ConfigurationStatus.ENABLED,
        validFrom: undefined,
        validUntil: undefined,
        source: EntitlementSource.INITIALIZATION,
        sourceId: undefined,
      },
    ]);
  });
});
