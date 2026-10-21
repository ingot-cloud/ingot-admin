import { ExportTaskStatus, type MemberWorkbookTask } from "@ingot/admin-common";
import { TenantDepartmentWorkbookStatusAPI } from "@/api/iam/directory";

const POLL_INTERVAL_MS = 1000;
const POLL_ATTEMPTS = 60;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function pollWorkbookTask(id: string): Promise<MemberWorkbookTask> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const current = (await TenantDepartmentWorkbookStatusAPI(id)).data;
    if (
      current.status === ExportTaskStatus.PENDING ||
      current.status === ExportTaskStatus.RUNNING
    ) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }
    return current;
  }
  throw new Error("任务超时，请稍后在导入历史中查看");
}
