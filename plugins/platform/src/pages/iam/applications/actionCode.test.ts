import { describe, expect, it } from "vitest";
import { actionCodeLocal, actionCodePrefix } from "./actionCode";

describe("application action code prefix", () => {
  it("拼出应用与资源前缀，并去掉已有前缀", () => {
    expect(actionCodePrefix("iam-platform", "account")).toBe("iam-platform:account:");
    expect(actionCodeLocal("iam-platform:account:read", "iam-platform:account:")).toBe("read");
    expect(actionCodeLocal("read", "iam-platform:account:")).toBe("read");
  });
});
