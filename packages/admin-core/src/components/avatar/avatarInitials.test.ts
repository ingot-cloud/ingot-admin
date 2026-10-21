import { describe, expect, it } from "vitest";
import { avatarInitials } from "./avatarInitials";

describe("avatarInitials", () => {
  it("空姓名返回空串", () => {
    expect(avatarInitials()).toBe("");
    expect(avatarInitials("  ")).toBe("");
  });

  it("只取姓名最后一个字", () => {
    expect(avatarInitials("王")).toBe("王");
    expect(avatarInitials("王超")).toBe("超");
    expect(avatarInitials("欧阳修")).toBe("修");
    expect(avatarInitials("池鑫鑫")).toBe("鑫");
  });
});
