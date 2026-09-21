<template>
  <in-drawer v-model="visible" title="导出成员" :loading="loading" size="640px">
    <p class="mb-12px text-[var(--el-text-color-secondary)]">
      导出先登记任务再轮询状态。失败只展示粗码；过期或进行中不会下载。
    </p>
    <div v-if="task" class="mb-12px">
      状态：{{ task.status }}
      <span v-if="task.failureCode">（{{ task.failureCode }}）</span>
    </div>
    <el-table v-if="records.length" :data="records" size="small">
      <el-table-column label="成员" min-width="160">
        <template #default="{ row }">
          {{ row.record.displayName || row.record.id }}
        </template>
      </el-table-column>
      <el-table-column prop="record.status" label="状态" width="120" />
    </el-table>
    <template #footer>
      <in-button @click="visible = false">关闭</in-button>
      <in-button type="primary" :loading="loading" :disabled="loading" @in-click="privateStart">
        开始导出
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import {
  ExportTaskStatus,
  type ExportTask,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantMemberExportCreateAPI,
  TenantMemberExportDownloadAPI,
  TenantMemberExportStatusAPI,
  TenantSettingsAPI,
} from "@/api/iam/directory";

defineOptions({ name: "MemberExportDrawer" });

const visible = ref(false);
const loading = ref(false);
const task = ref<ExportTask>();
const records = ref<Array<ResourceDetail<MemberRecord>>>([]);

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const pollStatus = async (id: string): Promise<ExportTask> => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await TenantMemberExportStatusAPI(id);
    const current = response.data;
    task.value = current;
    if (
      current.status === ExportTaskStatus.PENDING ||
      current.status === ExportTaskStatus.RUNNING
    ) {
      await sleep(1000);
      continue;
    }
    return current;
  }
  throw new Error("导出超时，请稍后重试");
};

const privateStart = (): void => {
  loading.value = true;
  task.value = undefined;
  records.value = [];
  TenantSettingsAPI()
    .then((settings) =>
      TenantMemberExportCreateAPI({ expectedVersion: settings.data.version }),
    )
    .then((created) => pollStatus(created.data.id))
    .then((current) => {
      if (current.status === ExportTaskStatus.FAILED) {
        Message.error(`导出失败：${current.failureCode || "未知原因"}`);
        return;
      }
      if (current.status === ExportTaskStatus.EXPIRED) {
        Message.warning("导出任务已过期，未下载");
        return;
      }
      if (current.status !== ExportTaskStatus.SUCCEEDED) {
        Message.warning("导出尚未完成，未下载");
        return;
      }
      return TenantMemberExportDownloadAPI(current.id).then((response) => {
        records.value = response.data.records ?? [];
        Message.success("导出完成");
      });
    })
    .catch((error: unknown) => {
      const text = error instanceof Error ? error.message : "导出失败";
      Message.error(text);
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    task.value = undefined;
    records.value = [];
    visible.value = true;
  },
});
</script>
