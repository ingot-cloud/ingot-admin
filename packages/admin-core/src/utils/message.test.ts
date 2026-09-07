import { beforeEach, describe, expect, it, vi } from "vitest";

const { elMessage } = vi.hoisted(() => ({
  elMessage: vi.fn(),
}));

vi.mock("element-plus", () => ({
  ElMessage: elMessage,
  ElMessageBox: {},
}));

vi.mock("./confirm-dialog", () => ({
  openConfirmDialog: vi.fn(),
}));

import { Message, MESSAGE_CLASS } from "./message";

describe("Message", () => {
  beforeEach(() => {
    elMessage.mockReset();
  });

  it("success 始终带 in-message", () => {
    Message.success("删除成功");
    expect(elMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "删除成功",
        type: "success",
        customClass: MESSAGE_CLASS,
      }),
    );
  });

  it("warning 合并调用方 customClass", () => {
    Message.warning("请先勾选要编辑的部门", { customClass: "extra" });
    expect(elMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "请先勾选要编辑的部门",
        type: "warning",
        customClass: `${MESSAGE_CLASS} extra`,
      }),
    );
  });
});
