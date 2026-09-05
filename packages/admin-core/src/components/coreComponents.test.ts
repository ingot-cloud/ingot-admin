import { describe, expect, it } from "vitest";
import { coreGlobalComponents } from "./coreComponents";

const movedComponentNames = [
  "InAvatar",
  "InInputTag",
  "InTag",
  "InTagEnum",
  "CommonStatusButton",
  "InCommonStatusTag",
  "InStatusButton",
  "AccountStatusEditButton",
  "AccountStatusView",
  "InPageFrame",
  "InTableActions",
  "InColumnSetting",
] as const;

describe("coreGlobalComponents", () => {
  it.each(movedComponentNames)("注册通用组件 %s", (name) => {
    expect(coreGlobalComponents[name]).toBeTypeOf("object");
  });
});
