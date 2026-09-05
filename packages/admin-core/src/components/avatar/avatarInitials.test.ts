import { describe, expect, it } from "vitest";
import { avatarInitials } from "./avatarInitials";

describe("avatarInitials", () => {
  it("空姓名返回空串", () => {
    expect(avatarInitials()).toBe("");
    expect(avatarInitials("  ")).toBe("");
  });

  it("不超过两个字时使用全文", () => {
    expect(avatarInitials("王")).toBe("王");
    expect(avatarInitials("王超")).toBe("王超");
  });

  it("超过两个字时取最后两个字", () => {
    expect(avatarInitials("欧阳修")).toBe("阳修");
    expect(avatarInitials("池鑫鑫")).toBe("鑫鑫");
  });
});
