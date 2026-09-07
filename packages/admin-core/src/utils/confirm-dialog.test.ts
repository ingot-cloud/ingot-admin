import { beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

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
  DEFAULT_CONFIRM_TITLE,
  openConfirmDialog,
  renderConfirmMessage,
} from "./confirm-dialog";
import IconSuccessFilled from "@/components/icons/IconSuccessFilled.vue";

describe("openConfirmDialog", () => {
  beforeEach(() => {
    confirm.mockReset();
    confirm.mockResolvedValue("confirm");
  });

  it("默认全屏居中、可关闭、带警告图标", async () => {
    await openConfirmDialog("将移除该成员");
    expect(confirm).toHaveBeenCalledTimes(1);
    const [message, options] = confirm.mock.calls[0] ?? [];
    expect(options).toEqual(
      expect.objectContaining({
        customClass: `${CONFIRM_DIALOG_CLASS} is-closable`,
        modalClass: CONFIRM_DIALOG_OVERLAY_CLASS,
        showClose: true,
        closeOnClickModal: false,
        closeOnPressEscape: true,
        cancelButtonText: "取消",
        confirmButtonText: "确定",
      }),
    );
    const vnode = renderConfirmMessage("将移除该成员");
    expect(vnode.props?.class).toBe("in-confirm-dialog__body");
    expect(JSON.stringify(message)).toContain(DEFAULT_CONFIRM_TITLE);
    expect(JSON.stringify(message)).toContain("将移除该成员");
    expect(JSON.stringify(message)).toContain("is-warning");
  });

  it("可关闭标题左侧图标并自定义内容", async () => {
    const content = h("span", { class: "custom-body" }, "杨紫微 来自 英格特云");
    await openConfirmDialog(content, {
      title: "你确定要恢复该员工账号吗？",
      icon: false,
      showClose: false,
      closeOnPressEscape: false,
    });
    const [message, options] = confirm.mock.calls[0] ?? [];
    expect(options).toEqual(
      expect.objectContaining({
        customClass: `${CONFIRM_DIALOG_CLASS} is-no-close`,
        showClose: false,
        closeOnPressEscape: false,
      }),
    );
    const tree = JSON.stringify(message);
    expect(tree).toContain("你确定要恢复该员工账号吗？");
    expect(tree).toContain("custom-body");
    expect(tree).not.toContain("in-confirm-dialog__icon");
  });

  it("自定义图标覆盖默认语气图标", () => {
    const vnode = renderConfirmMessage("已保存", {
      type: "success",
      icon: IconSuccessFilled,
      title: "完成",
    });
    const tree = JSON.stringify(vnode);
    expect(tree).toContain("完成");
    expect(tree).toContain("in-confirm-dialog__icon");
    expect(tree).not.toContain("is-success");
  });
});
