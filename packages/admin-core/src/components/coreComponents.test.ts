import { describe, expect, it } from "vitest";
import { coreGlobalComponents } from "./coreComponents";

const movedComponentNames = [
  "InInputTag",
  "InTag",
  "InTagEnum",
  "CommonStatusButton",
  "CommonStatusTag",
  "InStatusButton",
  "AccountStatusEditButton",
  "AccountStatusView",
] as const;

describe("coreGlobalComponents", () => {
  it.each(movedComponentNames)("注册通用组件 %s", (name) => {
    expect(coreGlobalComponents[name]).toBeTypeOf("object");
  });
});
