import { describe, expect, it } from "vitest";
import {
  buildUiPreferenceKey,
  COLUMN_SETTING_STORAGE_PREFIX,
  readUiPreference,
  resolveUiUserKey,
  UI_PREFERENCE_BROWSER_SCOPE,
  writeUiPreference,
} from "./uiPreference";

describe("uiPreference", () => {
  it("无用户标识时降级为浏览器作用域", () => {
    expect(resolveUiUserKey()).toBe(UI_PREFERENCE_BROWSER_SCOPE);
    expect(resolveUiUserKey({})).toBe(UI_PREFERENCE_BROWSER_SCOPE);
  });

  it("优先使用手机号作为用户键", () => {
    expect(resolveUiUserKey({ phone: "13800000000", nickname: "Ada" })).toBe("13800000000");
    expect(resolveUiUserKey({ nickname: "Ada" })).toBe("Ada");
  });

  it("按 user + tableId 读写前端偏好", () => {
    const key = buildUiPreferenceKey(COLUMN_SETTING_STORAGE_PREFIX, "13800000000", "member-list");
    writeUiPreference(key, ["name", "phone"]);
    expect(readUiPreference<string[]>(key, [])).toEqual(["name", "phone"]);
  });
});
