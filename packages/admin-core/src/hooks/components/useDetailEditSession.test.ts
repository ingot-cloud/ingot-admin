import { beforeEach, describe, expect, it, vi } from "vitest";

const { confirm } = vi.hoisted(() => ({
  confirm: vi.fn(),
}));

vi.mock("element-plus", () => ({
  ElMessageBox: {
    confirm,
  },
}));

import {
  CONFIRM_DIALOG_CLASS,
  CONFIRM_DIALOG_OVERLAY_CLASS,
  confirmUnsavedChanges,
  useDetailEditSession,
} from "./useDetailEditSession";

describe("useDetailEditSession", () => {
  beforeEach(() => {
    confirm.mockReset();
  });

  it("未编辑时直接允许离开", async () => {
    const session = useDetailEditSession();
    await expect(session.confirmLeave()).resolves.toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("编辑态确认后退出", async () => {
    confirm.mockResolvedValue("confirm");
    const session = useDetailEditSession();
    session.enterEdit();
    await expect(session.confirmLeave()).resolves.toBe(true);
    expect(session.editing.value).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        customClass: `${CONFIRM_DIALOG_CLASS} is-no-close`,
        modalClass: CONFIRM_DIALOG_OVERLAY_CLASS,
        cancelButtonText: "取消",
        confirmButtonText: "确定",
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
      }),
    );
  });

  it("编辑态取消确认则留下", async () => {
    confirm.mockRejectedValue("cancel");
    const session = useDetailEditSession();
    session.enterEdit();
    await expect(session.confirmLeave()).resolves.toBe(false);
    expect(session.editing.value).toBe(true);
  });

  it("confirmUnsavedChanges 取消时返回 false", async () => {
    confirm.mockRejectedValue("cancel");
    await expect(confirmUnsavedChanges()).resolves.toBe(false);
  });
});
