import { describe, expect, it } from "vitest";
import { ApiError } from "@ingot/http-client";
import { isPreparationFailure, isUncertainLogin } from "./errors";
describe("login error policy", () => {
  it("仅准备过期/绑定/CSRF可以准备修复", () => {
    for (const code of ["BFF_TRANSACTION_EXPIRED", "BFF_BINDING_MISMATCH", "BFF_CSRF_INVALID"])
      expect(isPreparationFailure({ code })).toBe(true);
    expect(isPreparationFailure({ status: 503 })).toBe(false);
  });
  it("网络/超时按实际HttpClient kind恢复，业务拒绝不恢复", () => {
    for (const kind of ["network", "timeout"] as const)
      expect(isUncertainLogin(new ApiError({ kind, code: "-1", message: "lost" }))).toBe(true);
    expect(isUncertainLogin({ code: "BFF_TRANSACTION_BUSY", status: 409 })).toBe(true);
    expect(isUncertainLogin({ status: 503 })).toBe(true);
    expect(isUncertainLogin({ status: 403 })).toBe(false);
    expect(isUncertainLogin({ kind: "cancelled" })).toBe(false);
  });
});
