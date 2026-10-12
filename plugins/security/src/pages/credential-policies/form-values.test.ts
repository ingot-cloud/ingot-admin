import { describe, expect, it, vi } from "vitest";
import { CredentialPolicyTypeEnum } from "@/models/enums/credentialEnums";
import { normalizeCredentialFormValues } from "./form-values";

vi.mock("@ingot/admin-core", () => ({ newEnumExt: vi.fn() }));

describe("凭证配置进入表单时的数字类型", () => {
  it.each([
    {
      type: CredentialPolicyTypeEnum.STRENGTH,
      config: {
        minLength: "6",
        maxLength: "32",
        forbiddenPatterns: ["123456"],
        requireDigit: false,
      },
      expected: { minLength: 6, maxLength: 32, forbiddenPatterns: ["123456"], requireDigit: false },
    },
    {
      type: CredentialPolicyTypeEnum.HISTORY,
      config: { checkCount: "5", enabled: true, keepRecentCount: 5 },
      expected: { checkCount: 5, enabled: true, keepRecentCount: 5 },
    },
    {
      type: CredentialPolicyTypeEnum.EXPIRATION,
      config: {
        maxDays: 90,
        warningDaysBefore: "7",
        graceLoginCount: "3",
        forceChangeAfterReset: true,
      },
      expected: {
        maxDays: 90,
        warningDaysBefore: 7,
        graceLoginCount: 3,
        forceChangeAfterReset: true,
      },
    },
    {
      type: CredentialPolicyTypeEnum.INITIAL_PASSWORD,
      config: { length: " 10 ", validHours: "0", generation: "FIXED", fixedPassword: "123456" },
      expected: { length: 10, validHours: 0, generation: "FIXED", fixedPassword: "123456" },
    },
  ])("转换 $type 的数字字段，保留其他配置且不修改查询数据", ({ type, config, expected }) => {
    const original = structuredClone(config);
    const form = normalizeCredentialFormValues(type, config);
    expect(form).toEqual(expected);
    expect(form).not.toBe(config);
    expect(config).toEqual(original);
  });

  it("不把空白、非法数字或非标量值转换为零，交给原有必填校验处理", () => {
    for (const value of [
      undefined,
      null,
      "",
      "  ",
      "invalid",
      "Infinity",
      NaN,
      Infinity,
      true,
      [],
      {},
    ]) {
      const form = normalizeCredentialFormValues(CredentialPolicyTypeEnum.HISTORY, {
        checkCount: value,
      });
      expect(form.checkCount).toBeUndefined();
    }
  });

  it("保留数字零及缺省字段，避免覆盖表单原有默认值", () => {
    expect(normalizeCredentialFormValues(CredentialPolicyTypeEnum.INITIAL_PASSWORD, {})).toEqual(
      {},
    );
    expect(
      normalizeCredentialFormValues(CredentialPolicyTypeEnum.EXPIRATION, {
        maxDays: 90,
        warningDaysBefore: 0,
        graceLoginCount: "0",
      }),
    ).toEqual({ maxDays: 90, warningDaysBefore: 0, graceLoginCount: 0 });
  });
});
