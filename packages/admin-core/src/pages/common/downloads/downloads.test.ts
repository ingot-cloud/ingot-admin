import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  DOWNLOAD_CENTER_PATH,
  DownloadTaskStatus,
  isDownloadTaskActive,
  type DownloadTask,
} from "@/models/download";
import { PageName } from "@/router/constants";
import { commonRoutes } from "@/router/routes/common";
import { hasActiveDownload, toDownloadPage } from "./downloadQuery";
import { formatFileSize } from "./table";

const dir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");

const task = (status: DownloadTaskStatus): DownloadTask => ({
  id: "1",
  source: "iam.member-workbook",
  title: "成员导出",
  status,
  createdAt: "2026-10-21T00:00:00Z",
  expiresAt: "2026-10-28T00:00:00Z",
});

describe("我的下载", () => {
  it("排队与生成中视为进行中，需要继续轮询", () => {
    expect(isDownloadTaskActive(DownloadTaskStatus.PENDING)).toBe(true);
    expect(isDownloadTaskActive(DownloadTaskStatus.RUNNING)).toBe(true);
    expect(isDownloadTaskActive(DownloadTaskStatus.SUCCEEDED)).toBe(false);
    expect(isDownloadTaskActive(DownloadTaskStatus.FAILED)).toBe(false);
    expect(isDownloadTaskActive(DownloadTaskStatus.EXPIRED)).toBe(false);
  });

  it("只有当前页存在进行中任务时才轮询", () => {
    const settled = toDownloadPage(
      { items: [task(DownloadTaskStatus.SUCCEEDED)], total: "1", page: 1, pageSize: 20 },
      1,
      20,
    );
    expect(settled.total).toBe(1);
    expect(hasActiveDownload(settled)).toBe(false);
    expect(hasActiveDownload({ ...settled, records: [task(DownloadTaskStatus.RUNNING)] })).toBe(
      true,
    );
    expect(hasActiveDownload(undefined)).toBe(false);
  });

  it("文件大小按 1024 进位展示", () => {
    expect(formatFileSize(undefined)).toBe("-");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("公共路由 /downloads 在主布局下渲染下载页", () => {
    const router = createRouter({ history: createMemoryHistory(), routes: commonRoutes });
    expect(router.resolve(DOWNLOAD_CENTER_PATH).name).toBe(PageName.DOWNLOADS);
  });

  it("仅可下载的任务展示下载按钮，失败任务展示原因", () => {
    expect(pageSource).toContain('v-if="item.status === DownloadTaskStatus.SUCCEEDED"');
    expect(pageSource).toContain("item.failureReason");
    expect(pageSource).toContain("暂无下载记录");
    expect(pageSource).toContain("导出文件保留 7 天");
  });
});
